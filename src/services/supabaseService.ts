import {
  supabase,
  isSupabaseConfigured,
  SupabaseProduct,
  SupabaseCategory,
  SupabaseOrder,
  SupabaseOrderItem,
  SupabaseReview,
  SupabaseOffer,
  SupabaseContactMessage,
} from '../lib/supabase';

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  customerId?: string;
  items: CheckoutItemInput[];
}

// Database helper that returns typed table access
const db = (table: string) => supabase.from(table) as any;

export const supabaseService = {
  // ==========================================
  // PRODUCTS
  // ==========================================
  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<{ products: SupabaseProduct[]; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { products: [], error: 'Supabase not configured' };
    }

    try {
      let query = db('products').select('*, categories(*)');

      if (params?.categoryId && params.categoryId !== 'all') {
        query = query.eq('category_id', params.categoryId);
      }

      if (params?.minPrice !== undefined) {
        query = query.gte('price', params.minPrice);
      }

      if (params?.maxPrice !== undefined) {
        query = query.lte('price', params.maxPrice);
      }

      if (params?.search && params.search.trim()) {
        query = query.ilike('name', `%${params.search.trim()}%`);
      }

      // Sort
      if (params?.sortBy === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (params?.sortBy === 'price-high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return { products: (data as SupabaseProduct[]) || [], error: null };
    } catch (err: any) {
      return { products: [], error: err.message || 'Error fetching products from Supabase' };
    }
  },

  async getProductById(id: string): Promise<{ product: SupabaseProduct | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { product: null, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('products')
        .select('*, categories(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { product: data as SupabaseProduct, error: null };
    } catch (err: any) {
      return { product: null, error: err.message };
    }
  },

  async createProduct(product: {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    category_id?: string;
    stock_quantity: number;
    is_available?: boolean;
  }): Promise<{ product: SupabaseProduct | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { product: null, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('products')
        .insert({
          name: product.name,
          description: product.description || null,
          price: product.price,
          image_url: product.image_url || null,
          category_id: product.category_id || null,
          stock_quantity: product.stock_quantity || 0,
          is_available: product.is_available ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return { product: data as SupabaseProduct, error: null };
    } catch (err: any) {
      return { product: null, error: err.message };
    }
  },

  async updateProduct(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      price: number;
      image_url: string;
      category_id: string;
      stock_quantity: number;
      is_available: boolean;
    }>
  ): Promise<{ product: SupabaseProduct | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { product: null, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { product: data as SupabaseProduct, error: null };
    } catch (err: any) {
      return { product: null, error: err.message };
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await db('products').delete().eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  async getCategories(): Promise<{ categories: SupabaseCategory[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { categories: [], error: 'Supabase not configured' };

    try {
      const { data, error } = await db('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { categories: (data as SupabaseCategory[]) || [], error: null };
    } catch (err: any) {
      return { categories: [], error: err.message };
    }
  },

  async createCategory(category: {
    name: string;
    image_url?: string;
  }): Promise<{ category: SupabaseCategory | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { category: null, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('categories')
        .insert({
          name: category.name,
          image_url: category.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { category: data as SupabaseCategory, error: null };
    } catch (err: any) {
      return { category: null, error: err.message };
    }
  },

  // ==========================================
  // CART (Persisted in cart_items table)
  // ==========================================
  async getCartItems(customerId: string) {
    if (!isSupabaseConfigured()) return { items: [], error: 'Supabase not configured' };

    try {
      const { data, error } = await db('cart_items')
        .select('*, products(*)')
        .eq('customer_id', customerId);

      if (error) throw error;
      return { items: data || [], error: null };
    } catch (err: any) {
      return { items: [], error: err.message };
    }
  },

  async syncCartItem(
    customerId: string,
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      if (quantity <= 0) {
        await db('cart_items')
          .delete()
          .eq('customer_id', customerId)
          .eq('product_id', productId);
        return { success: true, error: null };
      }

      // Upsert
      const { data: existing } = await db('cart_items')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        await db('cart_items')
          .update({ quantity })
          .eq('id', existing.id);
      } else {
        await db('cart_items').insert({
          customer_id: customerId,
          product_id: productId,
          quantity,
        });
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async clearCart(customerId: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      await db('cart_items').delete().eq('customer_id', customerId);
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // ORDERS & TRUSTED CHECKOUT
  // ==========================================
  async createCheckoutOrder(
    payload: CheckoutPayload
  ): Promise<{
    order: SupabaseOrder | null;
    orderNumber: string;
    error: string | null;
  }> {
    if (!isSupabaseConfigured()) {
      return { order: null, orderNumber: '', error: 'Supabase not configured' };
    }

    try {
      if (!payload.items || payload.items.length === 0) {
        return { order: null, orderNumber: '', error: 'Cart is empty' };
      }

      // 1. Fetch current live prices & stock quantities directly from database
      const productIds = payload.items.map((i) => i.productId);
      const { data: dbProducts, error: prodErr } = await db('products')
        .select('id, name, price, stock_quantity, is_available')
        .in('id', productIds);

      if (prodErr || !dbProducts) {
        throw new Error('Failed to verify products in database');
      }

      const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

      // 2. Validate stock & compute trusted total
      let calculatedTotal = 0;
      const orderItemsToInsert: Array<{
        product_id: string;
        quantity: number;
        price: number;
        subtotal: number;
      }> = [];

      for (const item of payload.items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (!prod.is_available) {
          throw new Error(`${prod.name} is currently unavailable`);
        }
        if (prod.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${prod.name}. Available: ${prod.stock_quantity}, Requested: ${item.quantity}`
          );
        }

        const unitPrice = Number(prod.price);
        const subtotal = Number((unitPrice * item.quantity).toFixed(2));
        calculatedTotal += subtotal;

        orderItemsToInsert.push({
          product_id: prod.id,
          quantity: item.quantity,
          price: unitPrice,
          subtotal,
        });
      }

      calculatedTotal = Number(calculatedTotal.toFixed(2));

      // 3. Resolve Customer record
      let customerId = payload.customerId;
      if (!customerId) {
        // Upsert customer by email
        const { data: existingCust } = await db('customers')
          .select('id')
          .eq('email', payload.customerEmail.toLowerCase().trim())
          .maybeSingle();

        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const { data: newCust, error: custErr } = await db('customers')
            .insert({
              name: payload.customerName,
              email: payload.customerEmail.toLowerCase().trim(),
              phone: payload.customerPhone || null,
              address: payload.deliveryAddress || null,
            })
            .select('id')
            .single();

          if (custErr) throw custErr;
          customerId = newCust?.id;
        }
      }

      // 4. Create Order
      const { data: newOrder, error: orderErr } = await db('orders')
        .insert({
          customer_id: customerId,
          total_amount: calculatedTotal,
          status: 'pending',
          payment_status: 'pending',
          delivery_address: payload.deliveryAddress,
        })
        .select()
        .single();

      if (orderErr || !newOrder) {
        throw new Error(orderErr?.message || 'Failed to insert order');
      }

      // 5. Insert Order Items
      const orderItemsWithOrderId = orderItemsToInsert.map((item) => ({
        ...item,
        order_id: newOrder.id,
      }));

      const { error: itemsErr } = await db('order_items').insert(orderItemsWithOrderId);
      if (itemsErr) {
        console.warn('Error inserting order items:', itemsErr);
      }

      // 6. Update inventory (deduct stock)
      for (const item of payload.items) {
        const prod = productMap.get(item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stock_quantity - item.quantity);
          await db('products')
            .update({
              stock_quantity: newStock,
              is_available: newStock > 0,
            })
            .eq('id', prod.id);
        }
      }

      // 7. Clear cart items for this customer
      if (customerId) {
        await db('cart_items').delete().eq('customer_id', customerId);
      }

      const readableOrderNumber = `FS-${newOrder.id.substring(0, 8).toUpperCase()}`;

      return {
        order: newOrder as SupabaseOrder,
        orderNumber: readableOrderNumber,
        error: null,
      };
    } catch (err: any) {
      console.error('Supabase checkout error:', err);
      return { order: null, orderNumber: '', error: err.message || 'Checkout failed' };
    }
  },

  async getOrders(params?: {
    customerId?: string;
    status?: string;
    limit?: number;
  }): Promise<{ orders: SupabaseOrder[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { orders: [], error: 'Supabase not configured' };

    try {
      let query = db('orders')
        .select('*, customers(*), order_items(*, products(*))')
        .order('created_at', { ascending: false });

      if (params?.customerId) {
        query = query.eq('customer_id', params.customerId);
      }

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { orders: (data as SupabaseOrder[]) || [], error: null };
    } catch (err: any) {
      return { orders: [], error: err.message };
    }
  },

  async getOrderById(id: string): Promise<{ order: SupabaseOrder | null; items: SupabaseOrderItem[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { order: null, items: [], error: 'Supabase not configured' };

    try {
      const { data: order, error: orderErr } = await db('orders')
        .select('*, customers(*)')
        .eq('id', id)
        .single();

      if (orderErr) throw orderErr;

      const { data: items, error: itemsErr } = await db('order_items')
        .select('*, products(*)')
        .eq('order_id', id);

      if (itemsErr) throw itemsErr;

      return { order: order as SupabaseOrder, items: (items as SupabaseOrderItem[]) || [], error: null };
    } catch (err: any) {
      return { order: null, items: [], error: err.message };
    }
  },

  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await db('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // OFFERS
  // ==========================================
  async getActiveOffers(): Promise<{ offers: SupabaseOffer[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { offers: [], error: 'Supabase not configured' };

    try {
      const now = new Date().toISOString();
      const { data, error } = await db('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter active dates
      const validOffers = (data || []).filter((o: any) => {
        if (o.start_date && new Date(o.start_date).toISOString() > now) return false;
        if (o.end_date && new Date(o.end_date).toISOString() < now) return false;
        return true;
      });

      return { offers: validOffers, error: null };
    } catch (err: any) {
      return { offers: [], error: err.message };
    }
  },

  async createOffer(offer: {
    title: string;
    description: string;
    discount_percentage: number;
    image_url?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ offer: SupabaseOffer | null; error: string | null }> {
    if (!isSupabaseConfigured()) return { offer: null, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('offers')
        .insert({
          title: offer.title,
          description: offer.description,
          discount_percentage: offer.discount_percentage,
          image_url: offer.image_url || null,
          start_date: offer.start_date || null,
          end_date: offer.end_date || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { offer: data as SupabaseOffer, error: null };
    } catch (err: any) {
      return { offer: null, error: err.message };
    }
  },

  // ==========================================
  // REVIEWS
  // ==========================================
  async getProductReviews(
    productId: string
  ): Promise<{ reviews: SupabaseReview[]; averageRating: number; error: string | null }> {
    if (!isSupabaseConfigured()) return { reviews: [], averageRating: 5.0, error: 'Supabase not configured' };

    try {
      const { data, error } = await db('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews = (data as SupabaseReview[]) || [];
      const averageRating =
        reviews.length > 0
          ? Number((reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
          : 4.8;

      return { reviews, averageRating, error: null };
    } catch (err: any) {
      return { reviews: [], averageRating: 4.8, error: err.message };
    }
  },

  async submitReview(review: {
    productId: string;
    customerName: string;
    rating: number;
    reviewText: string;
  }): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await db('reviews').insert({
        product_id: review.productId,
        customer_name: review.customerName,
        rating: Math.max(1, Math.min(5, review.rating)),
        review_text: review.reviewText,
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================
  // CONTACT MESSAGES
  // ==========================================
  async submitContactMessage(message: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await db('contact_messages').insert({
        name: message.name,
        email: message.email,
        phone: message.phone || null,
        message: message.message,
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getContactMessages(): Promise<{ messages: SupabaseContactMessage[]; error: string | null }> {
    if (!isSupabaseConfigured()) return { messages: [], error: 'Supabase not configured' };

    try {
      const { data, error } = await db('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { messages: (data as SupabaseContactMessage[]) || [], error: null };
    } catch (err: any) {
      return { messages: [], error: err.message };
    }
  },

  // ==========================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================
  subscribeToOrderStatus(orderId: string, onUpdate: (newStatus: string) => void) {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new?.status) {
            onUpdate(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
