import {
  User,
  Address,
  Category,
  Product,
  CartItem,
  Order,
  Review,
  Coupon,
  ContactMessage,
  AdminStats,
} from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from './supabaseService';

const API_BASE = '/api';

// Helper to get session ID for guest carts
export function getSessionId(): string {
  let sessionId = localStorage.getItem('freshsip_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('freshsip_session_id', sessionId);
  }
  return sessionId;
}

// Helper to get JWT token
export function getAuthToken(): string | null {
  return localStorage.getItem('freshsip_token');
}

// Unified fetch wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const sessionId = getSessionId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// Transform Supabase product row to frontend Product
function mapSupabaseProduct(p: any): Product {
  const price = Number(p.price) || 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: p.description || '',
    category_id: p.category_id || '',
    price,
    discount_price: price > 50 ? Number((price * 0.9).toFixed(0)) : undefined,
    image: p.image_url || '/src/assets/images/category_fresh_juices_1790231181678.jpg',
    ingredients: ['100% Raw Fruit Juice', 'Fresh Mint', 'Himalayan Rock Salt'],
    available_quantity: p.stock_quantity ?? 50,
    rating: 4.8,
    reviews_count: 24,
    status: p.is_available ? 'active' : 'out_of_stock',
    is_popular: true,
    is_featured: true,
    calories: 120,
    volume_ml: 350,
    created_at: p.created_at || new Date().toISOString(),
    category: p.categories
      ? {
          id: p.categories.id,
          name: p.categories.name,
          slug: p.categories.name.toLowerCase().replace(/\s+/g, '-'),
          description: '',
          image: p.categories.image_url || '',
          display_order: 1,
        }
      : undefined,
  };
}

export const api = {
  // Auth
  auth: {
    register: (payload: { name: string; email: string; password: string; phone?: string; address?: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (payload: { email: string; password: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (payload: { resetToken?: string; newPassword: string; email?: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () =>
      request<{ user: User; addresses: Address[] }>('/auth/me'),
  },

  // Users
  users: {
    getProfile: () =>
      request<{ user: User; addresses: Address[]; ordersCount: number }>('/users/profile'),
    updateProfile: (payload: Partial<User>) =>
      request<{ message: string; user: User }>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    addAddress: (payload: Omit<Address, 'id' | 'user_id'>) =>
      request<{ message: string; address: Address; addresses: Address[] }>('/users/address', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    deleteAddress: (id: string) =>
      request<{ message: string; addresses: Address[] }>(`/users/address/${id}`, {
        method: 'DELETE',
      }),
    getAdminCustomers: () =>
      request<{ customers: (User & { ordersCount: number; totalSpent: number; lastOrderDate?: string })[] }>(
        '/users/admin/customers'
      ),
  },

  // Categories
  categories: {
    getAll: async () => {
      if (isSupabaseConfigured()) {
        try {
          const { categories, error } = await supabaseService.getCategories();
          if (!error && categories.length > 0) {
            const mapped: Category[] = categories.map((c, idx) => ({
              id: c.id,
              name: c.name,
              slug: c.name.toLowerCase().replace(/\s+/g, '-'),
              description: `${c.name} prepared freshly to order.`,
              image: c.image_url || '/src/assets/images/category_fresh_juices_1790231181678.jpg',
              display_order: idx + 1,
            }));
            return { categories: mapped };
          }
        } catch (e) {
          console.warn('Supabase categories fetch error, using fallback:', e);
        }
      }
      return request<{ categories: Category[] }>('/categories');
    },
    create: (payload: Partial<Category>) =>
      request<{ message: string; category: Category }>('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<Category>) =>
      request<{ message: string; category: Category }>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ message: string; category: Category }>(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Products
  products: {
    getAll: async (params?: Record<string, string | number | boolean | undefined>) => {
      if (isSupabaseConfigured()) {
        try {
          const { products: sbProds, error } = await supabaseService.getProducts({
            search: params?.search as string,
            categoryId: params?.category as string,
            minPrice: params?.minPrice ? Number(params.minPrice) : undefined,
            maxPrice: params?.maxPrice ? Number(params.maxPrice) : undefined,
            sortBy: params?.sort as string,
          });

          if (!error && sbProds && sbProds.length > 0) {
            const mappedProds = sbProds.map(mapSupabaseProduct);
            return {
              products: mappedProds,
              total: mappedProds.length,
              page: 1,
              limit: mappedProds.length,
              totalPages: 1,
            };
          }
        } catch (e) {
          console.warn('Supabase products fetch failed, using backend fallback:', e);
        }
      }

      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== '') {
            searchParams.append(key, String(val));
          }
        });
      }
      const query = searchParams.toString();
      return request<{
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/products${query ? `?${query}` : ''}`);
    },

    getById: async (id: string) => {
      if (isSupabaseConfigured()) {
        try {
          const { product, error } = await supabaseService.getProductById(id);
          if (!error && product) {
            return {
              product: mapSupabaseProduct(product),
              reviews: [],
            };
          }
        } catch (e) {
          console.warn('Supabase getProductById failed:', e);
        }
      }
      return request<{ product: Product; reviews: Review[] }>(`/products/${id}`);
    },

    create: async (payload: Partial<Product>) => {
      if (isSupabaseConfigured()) {
        try {
          const { product, error } = await supabaseService.createProduct({
            name: payload.name || 'Fresh Juice',
            description: payload.description,
            price: payload.price || 99,
            image_url: payload.image,
            category_id: payload.category_id,
            stock_quantity: payload.available_quantity || 50,
            is_available: payload.status !== 'out_of_stock',
          });
          if (!error && product) {
            return { message: 'Product created successfully in Supabase', product: mapSupabaseProduct(product) };
          }
        } catch (e) {
          console.warn('Supabase createProduct failed:', e);
        }
      }
      return request<{ message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: async (id: string, payload: Partial<Product>) => {
      if (isSupabaseConfigured()) {
        try {
          const updates: any = {};
          if (payload.name) updates.name = payload.name;
          if (payload.description !== undefined) updates.description = payload.description;
          if (payload.price) updates.price = payload.price;
          if (payload.image) updates.image_url = payload.image;
          if (payload.category_id) updates.category_id = payload.category_id;
          if (payload.available_quantity !== undefined) updates.stock_quantity = payload.available_quantity;
          if (payload.status) updates.is_available = payload.status === 'active';

          const { product, error } = await supabaseService.updateProduct(id, updates);
          if (!error && product) {
            return { message: 'Product updated in Supabase', product: mapSupabaseProduct(product) };
          }
        } catch (e) {
          console.warn('Supabase updateProduct failed:', e);
        }
      }
      return request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string) => {
      if (isSupabaseConfigured()) {
        try {
          await supabaseService.deleteProduct(id);
        } catch (e) {
          console.warn('Supabase deleteProduct failed:', e);
        }
      }
      return request<{ message: string; product: Product }>(`/products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Cart
  cart: {
    get: () =>
      request<{
        cartId: string;
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        grandTotal: number;
      }>('/cart'),
    addItem: (payload: {
      productId: string;
      quantity?: number;
      size?: 'Small' | 'Medium' | 'Large';
      sugarLevel?: string;
      iceLevel?: string;
      toppings?: string[];
      notes?: string;
    }) =>
      request<{
        message: string;
        cartId: string;
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        grandTotal: number;
      }>('/cart', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateItem: (id: string, payload: Partial<CartItem>) =>
      request<{
        message: string;
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        grandTotal: number;
      }>(`/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    removeItem: (id: string) =>
      request<{
        message: string;
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        grandTotal: number;
      }>(`/cart/${id}`, {
        method: 'DELETE',
      }),
    clear: () =>
      request<{
        message: string;
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        grandTotal: number;
      }>('/cart', {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    create: async (payload: {
      customerName: string;
      customerEmail?: string;
      customerPhone: string;
      deliveryAddress: any;
      paymentMethod: string;
      couponCode?: string;
      items: any[];
      notes?: string;
    }) => {
      // If Supabase configured, create via Supabase trusted backend method
      if (isSupabaseConfigured()) {
        try {
          const addressStr = typeof payload.deliveryAddress === 'string'
            ? payload.deliveryAddress
            : `${payload.deliveryAddress.street || ''}, ${payload.deliveryAddress.city || ''}, ${payload.deliveryAddress.postalCode || ''}`;

          const formattedItems = payload.items.map((i: any) => ({
            productId: i.product_id || i.productId || i.product?.id,
            quantity: i.quantity || 1,
          }));

          const { order, orderNumber, error } = await supabaseService.createCheckoutOrder({
            customerName: payload.customerName,
            customerEmail: payload.customerEmail || 'customer@freshsip.com',
            customerPhone: payload.customerPhone,
            deliveryAddress: addressStr,
            items: formattedItems,
          });

          if (!error && order) {
            const mappedOrder: Order = {
              id: order.id,
              order_number: orderNumber,
              customer_name: payload.customerName,
              customer_email: payload.customerEmail || '',
              customer_phone: payload.customerPhone,
              delivery_address: {
                street: addressStr,
                city: 'Fresh City',
                state: '',
                postal_code: '',
              },
              subtotal: Number(order.total_amount),
              discount: 0,
              delivery_fee: 0,
              tax: 0,
              grand_total: Number(order.total_amount),
              payment_method: payload.paymentMethod as any,
              payment_status: order.payment_status === 'paid' ? 'Paid' : 'Pending',
              order_status: 'PLACED',
              status_history: [
                {
                  status: 'PLACED',
                  timestamp: order.created_at,
                  note: 'Order recorded in Supabase database.',
                },
              ],
              items: payload.items.map((it: any) => ({
                id: it.id || `item_${Math.random()}`,
                order_id: order.id,
                product_id: it.product_id || it.product?.id,
                product_name: it.product?.name || 'Fresh Juice',
                product_image: it.product?.image || '/src/assets/images/category_fresh_juices_1790231181678.jpg',
                quantity: it.quantity,
                size: it.size || 'Medium',
                sugar_level: it.sugar_level || 'Normal Sugar',
                ice_level: it.ice_level || 'Normal Ice',
                toppings: it.toppings || [],
                unit_price: it.unit_price || 120,
                total_price: (it.unit_price || 120) * it.quantity,
              })),
              created_at: order.created_at,
              updated_at: order.created_at,
            };

            return { message: 'Order created in Supabase database', order: mappedOrder };
          }
        } catch (e) {
          console.warn('Supabase checkout error, using backend orders endpoint:', e);
        }
      }

      return request<{ message: string; order: Order }>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getAll: async (params?: { status?: string; search?: string; email?: string; phone?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val) searchParams.append(key, val);
        });
      }
      const q = searchParams.toString();
      return request<{ orders: Order[] }>(`/orders${q ? `?${q}` : ''}`);
    },

    getById: (id: string) =>
      request<{ order: Order }>(`/orders/${id}`),

    updateStatus: (id: string, status: string, note?: string) =>
      request<{ message: string; order: Order }>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, note }),
      }),

    delete: (id: string) =>
      request<{ message: string; order: Order }>(`/orders/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reviews
  reviews: {
    getByProduct: async (productId: string) => {
      if (isSupabaseConfigured()) {
        try {
          const { reviews, averageRating, error } = await supabaseService.getProductReviews(productId);
          if (!error && reviews.length > 0) {
            return {
              reviews: reviews.map((r) => ({
                id: r.id,
                product_id: r.product_id,
                user_name: r.customer_name || 'Verified Customer',
                rating: r.rating,
                comment: r.review_text || '',
                created_at: r.created_at,
              })),
              averageRating,
              totalReviews: reviews.length,
            };
          }
        } catch (e) {
          console.warn('Supabase reviews error:', e);
        }
      }

      return request<{ reviews: Review[]; averageRating: number; totalReviews: number }>(
        `/reviews/product/${productId}`
      );
    },

    create: async (productId: string, payload: { rating: number; reviewText: string }) => {
      if (isSupabaseConfigured()) {
        try {
          const { success, error } = await supabaseService.submitReview({
            productId,
            customerName: 'FreshSip Fan',
            rating: payload.rating,
            reviewText: payload.reviewText,
          });
          if (success) {
            return {
              message: 'Review saved in Supabase database!',
              review: {
                id: `rev_${Date.now()}`,
                product_id: productId,
                user_name: 'Verified Customer',
                rating: payload.rating,
                comment: payload.reviewText,
                created_at: new Date().toISOString(),
              },
              updatedProductRating: payload.rating,
            };
          }
        } catch (e) {
          console.warn('Supabase submitReview failed:', e);
        }
      }

      return request<{ message: string; review: Review; updatedProductRating: number }>(
        `/reviews/product/${productId}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },

    delete: (id: string) =>
      request<{ message: string }>(`/reviews/${id}`, { method: 'DELETE' }),
  },

  // Coupons & Offers
  coupons: {
    getAll: (admin = false) =>
      request<{ coupons: Coupon[] }>(`/coupons${admin ? '?admin=true' : ''}`),
    validate: (code: string, cartSubtotal: number) =>
      request<{
        valid: boolean;
        code: string;
        title: string;
        discount: number;
        discountType: string;
        discountValue: number;
        minOrderValue: number;
      }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartSubtotal }),
      }),
    create: (payload: Partial<Coupon>) =>
      request<{ message: string; coupon: Coupon }>('/coupons', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<Coupon>) =>
      request<{ message: string; coupon: Coupon }>(`/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ message: string; coupon: Coupon }>(`/coupons/${id}`, {
        method: 'DELETE',
      }),
  },

  // Contact
  contact: {
    submit: async (payload: { name: string; email: string; phone?: string; message: string }) => {
      if (isSupabaseConfigured()) {
        try {
          const { success, error } = await supabaseService.submitContactMessage(payload);
          if (success) {
            return { message: 'Your message has been sent successfully.', id: `msg_${Date.now()}` };
          }
        } catch (e) {
          console.warn('Supabase contact submit failed:', e);
        }
      }

      return request<{ message: string; id: string }>('/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getAll: () =>
      request<{ messages: ContactMessage[] }>('/contact'),
    updateStatus: (id: string, status: string) =>
      request<{ message: string; contactMessage: ContactMessage }>(`/contact/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  // Admin
  admin: {
    getStats: () =>
      request<AdminStats>('/admin/stats'),
  },
};
