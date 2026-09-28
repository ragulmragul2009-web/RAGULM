import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  discount: number;
  appliedCoupon: string | null;
  isCartOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (
    product: Product,
    options?: {
      quantity?: number;
      size?: 'Small' | 'Medium' | 'Large';
      sugarLevel?: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
      iceLevel?: 'No Ice' | 'Less Ice' | 'Normal Ice';
      toppings?: string[];
      notes?: string;
    }
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { success, error: toastError, info } = useToast();

  const fetchCart = useCallback(async () => {
    try {
      const data = await api.cart.get();
      setItems(data.items || []);
      setItemCount(data.itemCount || 0);
      setSubtotal(data.subtotal || 0);
      setDeliveryFee(data.deliveryFee || 0);
      setTax(data.tax || 0);
      setGrandTotal(data.grandTotal || 0);
    } catch {
      // Fallback: empty cart if server offline temporarily
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Recalculate discount if coupon applied
  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
      api.coupons
        .validate(appliedCoupon, subtotal)
        .then((res) => {
          if (res.valid) {
            setDiscount(res.discount);
          } else {
            setAppliedCoupon(null);
            setDiscount(0);
          }
        })
        .catch(() => {
          setAppliedCoupon(null);
          setDiscount(0);
        });
    } else {
      setDiscount(0);
    }
  }, [appliedCoupon, subtotal]);

  const addToCart = async (
    product: Product,
    options?: {
      quantity?: number;
      size?: 'Small' | 'Medium' | 'Large';
      sugarLevel?: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
      iceLevel?: 'No Ice' | 'Less Ice' | 'Normal Ice';
      toppings?: string[];
      notes?: string;
    }
  ): Promise<boolean> => {
    try {
      const res = await api.cart.addItem({
        productId: product.id,
        quantity: options?.quantity || 1,
        size: options?.size || 'Medium',
        sugarLevel: options?.sugarLevel || 'Normal Sugar',
        iceLevel: options?.iceLevel || 'Normal Ice',
        toppings: options?.toppings || [],
        notes: options?.notes || '',
      });

      setItems(res.items);
      setItemCount(res.itemCount);
      setSubtotal(res.subtotal);
      setDeliveryFee(res.deliveryFee);
      setTax(res.tax);
      setGrandTotal(res.grandTotal);

      success(`Added ${product.name} to cart!`);
      return true;
    } catch (err: any) {
      toastError(err.message || 'Could not add to cart');
      return false;
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const res = await api.cart.updateItem(itemId, { quantity: newQuantity });
      setItems(res.items);
      setItemCount(res.itemCount);
      setSubtotal(res.subtotal);
      setDeliveryFee(res.deliveryFee);
      setTax(res.tax);
      setGrandTotal(res.grandTotal);
    } catch (err: any) {
      toastError(err.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await api.cart.removeItem(itemId);
      setItems(res.items);
      setItemCount(res.itemCount);
      setSubtotal(res.subtotal);
      setDeliveryFee(res.deliveryFee);
      setTax(res.tax);
      setGrandTotal(res.grandTotal);
      info('Item removed from cart');
    } catch (err: any) {
      toastError(err.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.cart.clear();
      setItems([]);
      setItemCount(0);
      setSubtotal(0);
      setDeliveryFee(0);
      setTax(0);
      setGrandTotal(0);
      setAppliedCoupon(null);
      setDiscount(0);
    } catch (err: any) {
      toastError(err.message || 'Failed to clear cart');
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!code || !code.trim()) {
      toastError('Please enter a coupon code');
      return false;
    }

    try {
      const res = await api.coupons.validate(code.trim(), subtotal);
      if (res.valid) {
        setAppliedCoupon(res.code);
        setDiscount(res.discount);
        success(`Coupon ${res.code} applied! Saved ₹${res.discount}`);
        return true;
      }
      return false;
    } catch (err: any) {
      toastError(err.message || 'Invalid coupon code');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    info('Coupon removed');
  };

  const effectiveGrandTotal = Math.max(0, grandTotal - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        tax,
        grandTotal: effectiveGrandTotal,
        discount,
        appliedCoupon,
        isCartOpen,
        loading,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
