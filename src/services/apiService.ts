import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Get API base URL from Vite env or fallback
const defaultDevUrl = 'http://localhost:8000/api/user';
const defaultProdUrl = 'https://api.syrn.com/api/user';

let baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? defaultProdUrl : defaultDevUrl);

function applyAndroidHost(url: string): string {
  if (Capacitor.getPlatform() !== 'android') {
    return url;
  }
  if (url.includes('localhost')) {
    return url.replace('localhost', '10.0.2.2');
  }
  if (url.includes('127.0.0.1')) {
    return url.replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

baseUrl = applyAndroidHost(baseUrl);

/** Base URL for Laravel public storage (no /api/user suffix). */
export function getAssetBaseUrl(): string {
  return applyAndroidHost(baseUrl.replace(/\/api\/user\/?$/, '').replace(/\/api\/?$/, ''));
}

export function resolveStorageUrl(pathOrUrl: string): string {
  const assetBase = getAssetBaseUrl();

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const storageMatch = pathOrUrl.match(/\/storage\/(.+)$/);
    if (storageMatch) {
      return `${assetBase}/storage/${storageMatch[1]}`;
    }
    return applyAndroidHost(pathOrUrl);
  }

  const path = pathOrUrl.replace(/^\//, '');
  if (path.startsWith('storage/')) {
    return `${assetBase}/${path}`;
  }
  return `${assetBase}/storage/${path}`;
}

// In-memory token cache so the Bearer header is set reliably (axios + async Preferences)
let cachedAuthToken: string | null = null;

export async function initializeAuth(): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key: 'auth_token' });
    cachedAuthToken = value;
    return value;
  } catch (error) {
    console.error('Failed to load auth token:', error);
    cachedAuthToken = null;
    return null;
  }
}

export async function persistAuthSession(token: string, user: UserProfile): Promise<void> {
  cachedAuthToken = token;
  await Preferences.set({ key: 'auth_token', value: token });
  await Preferences.set({ key: 'user', value: JSON.stringify(user) });
}

export async function clearAuthSession(): Promise<void> {
  cachedAuthToken = null;
  await Preferences.remove({ key: 'auth_token' });
  await Preferences.remove({ key: 'user' });
}

export function isAuthenticated(): boolean {
  return !!cachedAuthToken;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

function setAuthorizationHeader(config: import('axios').InternalAxiosRequestConfig, token: string) {
  const value = `Bearer ${token}`;
  if (config.headers && typeof config.headers.set === 'function') {
    config.headers.set('Authorization', value);
  } else if (config.headers) {
    config.headers.Authorization = value;
  }
}

// Create axios client
const client = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

client.interceptors.request.use(
  async (config) => {
    let token = cachedAuthToken;
    if (!token) {
      token = await initializeAuth();
    }
    if (token) {
      setAuthorizationHeader(config, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await clearAuthSession();
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPublicAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/splash');
      if (typeof window !== 'undefined' && !isPublicAuthRoute) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  skin_type: string | null;
  skin_concern: string | null;
  profile_picture: string | null;
  created_at: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
    token: string;
  };
  errors?: Record<string, string[]>;
  attempts_left?: number;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

export interface Brand {
  brand_id: number;
  brand_name: string;
  description: string | null;
}

export interface SkinType {
  skin_type_id: number;
  name: string;
  description: string | null;
}

export function getSkinTypeLabel(skinType: SkinType | string | null | undefined): string | null {
  if (!skinType) return null;
  if (typeof skinType === 'object') return skinType.name;
  return skinType;
}

export function getProductImageUrl(product: Pick<Product, 'image_urls' | 'images' | 'product_image'>): string | null {
  if (product.images?.[0]) {
    return resolveStorageUrl(product.images[0]);
  }
  if (product.image_urls?.[0]) {
    return resolveStorageUrl(product.image_urls[0]);
  }
  if (product.product_image) {
    return resolveStorageUrl(product.product_image);
  }
  return null;
}

export function formatProductPrice(price: string | number | null | undefined): string {
  const value = parseFloat(String(price ?? ''));
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export interface Product {
  product_id: number;
  category_id?: number;
  category?: Category;
  brand?: Brand;
  product_name: string;
  ingredients: string | null;
  skin_type_id?: number | null;
  skin_type?: SkinType | string | null;
  skin_concern: string | null;
  price: string;
  qty?: number;
  description: string | null;
  images?: string[];
  image_urls?: string[];
  product_image?: string | null;
  created_at: string;
  reviews?: Review[];
}

export interface CartItem {
  cart_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: Product;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  item_count: number;
  subtotal: number;
}

export interface PaymentBank {
  payment_bank_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  qr_image_url: string | null;
  is_active: boolean;
}

export type OrderStatus = 'pending_payment' | 'awaiting_verification' | 'confirmed' | 'cancelled';

export interface OrderItem {
  order_item_id: number;
  product_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface OrderReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface OrderReceipt {
  receipt_number: string;
  order_number: string;
  issued_at: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderReceiptItem[];
  subtotal: string;
  total: string;
  customer_note: string | null;
  payment: {
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    amount: string;
    verified_at?: string | null;
    verified_by?: string | null;
    admin_note?: string | null;
  };
}

export interface Order {
  order_id: number;
  order_number: string;
  receipt_number?: string | null;
  status: OrderStatus;
  subtotal: string;
  total: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  customer_note: string | null;
  confirmed_at?: string | null;
  items?: OrderItem[];
  payment?: {
    slip_image_url: string | null;
    status: string;
    reviewed_at?: string | null;
    admin_note?: string | null;
    payment_bank?: PaymentBank;
  } | null;
  receipt?: OrderReceipt | null;
  created_at: string;
}

export interface Review {
  review_id: number;
  user?: UserProfile;
  product?: Product;
  rating: number;
  comment: string | null;
  review_date: string;
}

export interface RoutineStep {
  step_id: number;
  routine_id: number;
  product_id: number;
  step_order: number;
  instruction: string | null;
  product?: Product;
}

export interface Routine {
  routine_id: number;
  user_id: number;
  routine_name: string;
  routine_time: 'Morning' | 'Evening';
  created_at: string;
  steps?: RoutineStep[];
}

export interface Favourite {
  favourite_id: number;
  user_id: number;
  product_id: number;
  saved_at: string;
  product?: Product;
}

export class ApiService {
  /**
   * Register a new user
   */
  static async register(firstName: string, lastName: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await client.post('/register', {
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      });

      return {
        success: true,
        message: response.data.message || 'User registered successfully.',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed.';
      const errors = error.response?.data?.errors;
      return {
        success: false,
        message,
        errors,
      };
    }
  }

  /**
   * Log in user
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await client.post('/login', {
        email,
        password,
      });

      return {
        success: true,
        message: response.data.message || 'Login successful.',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Invalid email or password credentials.';
      const errors = error.response?.data?.errors;
      return {
        success: false,
        message,
        errors,
      };
    }
  }

  /**
   * Log out user
   */
  static async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await client.post('/logout');
      await clearAuthSession();
      return {
        success: true,
        message: response.data.message || 'Logged out successfully.',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      await clearAuthSession();
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed.',
      };
    }
  }

  static async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await client.get('/profile');
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async updateProfile(payload: {
    full_name: string;
    skin_type?: string | null;
    skin_concern?: string | null;
  }): Promise<{ success: boolean; message: string; data?: UserProfile; errors?: Record<string, string[]> }> {
    try {
      const response = await client.put('/profile', payload);
      return {
        success: true,
        message: response.data.message || 'Profile updated.',
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile.',
        errors: error.response?.data?.errors,
      };
    }
  }

  static async getSkinTypes(): Promise<SkinType[]> {
    try {
      const response = await client.get('/skin-types');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching skin types:', error);
      return [];
    }
  }

  /**
   * Get all product categories
   */
  static async getCategories(): Promise<Category[]> {
    try {
      const response = await client.get('/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get all products with optional filters
   */
  static async getProducts(filters?: { category_id?: number; skin_type?: string; skin_concern?: string }): Promise<Product[]> {
    try {
      const response = await client.get('/products', { params: filters });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get details of a specific product
   */
  static async getProduct(productId: number): Promise<Product | null> {
    try {
      const response = await client.get(`/products/${productId}`);
      return response.data.data || null;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get user's routines
   */
  static async getRoutines(): Promise<Routine[]> {
    try {
      const response = await client.get('/routines');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching routines:', error);
      return [];
    }
  }

  /**
   * Create a new skincare routine
   */
  static async createRoutine(routineName: string, routineTime: 'Morning' | 'Evening', steps?: { product_id: number; step_order: number; instruction: string }[]): Promise<{ success: boolean; message: string; data?: Routine }> {
    try {
      const response = await client.post('/routines', {
        routine_name: routineName,
        routine_time: routineTime,
        steps: steps || []
      });
      return {
        success: true,
        message: response.data.message || 'Routine created successfully.',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error creating routine:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create routine.'
      };
    }
  }

  /**
   * Delete a skincare routine
   */
  static async deleteRoutine(routineId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await client.delete(`/routines/${routineId}`);
      return {
        success: true,
        message: response.data.message || 'Routine deleted successfully.'
      };
    } catch (error: any) {
      console.error(`Error deleting routine ${routineId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete routine.'
      };
    }
  }

  /**
   * Update steps for an existing routine
   */
  static async updateRoutineSteps(routineId: number, steps: { product_id: number; step_order: number; instruction: string }[]): Promise<{ success: boolean; message: string; data?: Routine }> {
    try {
      const response = await client.put(`/routines/${routineId}/steps`, { steps });
      return {
        success: true,
        message: response.data.message || 'Steps updated successfully.',
        data: response.data.data
      };
    } catch (error: any) {
      console.error(`Error updating steps for routine ${routineId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update routine steps.'
      };
    }
  }

  /**
   * Get user's favorite products
   */
  static async getFavourites(): Promise<Favourite[]> {
    try {
      const response = await client.get('/favourites');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  /**
   * Add a product to favorites
   */
  static async addFavourite(productId: number): Promise<{ success: boolean; message: string; data?: Favourite }> {
    try {
      const response = await client.post('/favourites', { product_id: productId });
      return {
        success: true,
        message: response.data.message || 'Product saved to favourites.',
        data: response.data.data
      };
    } catch (error: any) {
      console.error(`Error adding favorite for product ${productId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add to favorites.'
      };
    }
  }

  /**
   * Remove a product from favorites
   */
  static async deleteFavourite(favouriteId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await client.delete(`/favourites/${favouriteId}`);
      return {
        success: true,
        message: response.data.message || 'Product removed from favourites.'
      };
    } catch (error: any) {
      console.error(`Error deleting favorite ${favouriteId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from favorites.'
      };
    }
  }

  /**
   * Post a product review
   */
  static normalizeCart(raw: unknown): Cart | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const data = raw as Record<string, unknown>;
    const rawItems = data.items;
    const items = Array.isArray(rawItems)
      ? rawItems
      : rawItems && typeof rawItems === 'object' && Array.isArray((rawItems as { data?: unknown }).data)
        ? (rawItems as { data: CartItem[] }).data
        : [];

    return {
      cart_id: Number(data.cart_id),
      items,
      item_count: Number(data.item_count) || items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      subtotal: Number(data.subtotal) || 0,
    };
  }

  static async getCart(): Promise<Cart | null> {
    try {
      const response = await client.get('/cart');
      return ApiService.normalizeCart(response.data.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }

  static async addToCart(productId: number, quantity = 1): Promise<{ success: boolean; message: string; data?: Cart }> {
    try {
      const response = await client.post('/cart/items', { product_id: productId, quantity });
      const cart = ApiService.normalizeCart(response.data.data) ?? undefined;
      return { success: true, message: response.data.message, data: cart };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to add to cart.' };
    }
  }

  static async updateCartItem(cartItemId: number, quantity: number): Promise<{ success: boolean; message: string; data?: Cart }> {
    try {
      const response = await client.put(`/cart/items/${cartItemId}`, { quantity });
      const cart = ApiService.normalizeCart(response.data.data) ?? undefined;
      return { success: true, message: response.data.message, data: cart };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to update cart.' };
    }
  }

  static async removeCartItem(cartItemId: number): Promise<{ success: boolean; message: string; data?: Cart }> {
    try {
      const response = await client.delete(`/cart/items/${cartItemId}`);
      const cart = ApiService.normalizeCart(response.data.data) ?? undefined;
      return { success: true, message: response.data.message, data: cart };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to remove item.' };
    }
  }

  static async getPaymentBanks(): Promise<PaymentBank[]> {
    try {
      const response = await client.get('/payment-banks');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payment banks:', error);
      return [];
    }
  }

  static async checkout(payload: {
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    customer_note?: string;
  }): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const response = await client.post('/orders/checkout', payload);
      return { success: true, message: response.data.message, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Checkout failed.' };
    }
  }

  static async getOrders(): Promise<Order[]> {
    try {
      const response = await client.get('/orders');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  static async getOrder(orderId: number): Promise<Order | null> {
    try {
      const response = await client.get(`/orders/${orderId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  static async submitOrderPayment(
    orderId: number,
    paymentBankId: number,
    slipFile: File
  ): Promise<{ success: boolean; message: string; data?: Order }> {
    try {
      const formData = new FormData();
      formData.append('payment_bank_id', String(paymentBankId));
      formData.append('slip_image', slipFile);

      const response = await client.post(`/orders/${orderId}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, message: response.data.message, data: response.data.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to submit payment.' };
    }
  }

  static async addReview(productId: number, rating: number, comment: string): Promise<{ success: boolean; message: string; data?: Review }> {
    try {
      const response = await client.post('/reviews', {
        product_id: productId,
        rating,
        comment
      });
      return {
        success: true,
        message: response.data.message || 'Review added successfully.',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error adding review:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add review.'
      };
    }
  }
}
