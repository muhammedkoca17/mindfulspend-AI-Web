import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (email: string, password: string, full_name: string) =>
  api.post('/auth/register', { email, password, full_name });

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

export const updateProfile = (data: { monthly_salary?: number; full_name?: string; risk_profile?: string }) =>
  api.patch('/auth/me', data);

export const completeOnboarding = (data: any) =>
  api.post('/onboarding/complete', data);

export const getOnboardingStatus = () =>
  api.get('/onboarding/status');

export const getProducts = () =>
  api.get('/products/');

export const getCategories = () =>
  api.get('/products/categories');

export const getCart = () => api.get('/cart/');

export const addToCart = (product_id: number, quantity: number) =>
  api.post('/cart/add', { product_id, quantity });

export const updateCartItem = (item_id: number, quantity: number) =>
  api.put(`/cart/item/${item_id}`, { quantity });

export const removeFromCart = (item_id: number) =>
  api.delete(`/cart/item/${item_id}`);

export const clearCart = () => api.delete('/cart/clear');

export const checkout = () =>
  api.post('/cart/checkout');

export const confirmCheckout = (nudge_accepted: boolean) =>
  api.post('/cart/checkout/confirm', { nudge_accepted });

export const getGoals = () =>
  api.get('/goals/');

export const createGoal = (data: any) =>
  api.post('/goals/', data);

export const updateGoal = (goal_id: number, data: any) =>
  api.patch(`/goals/${goal_id}`, data);

export const deleteGoal = (goal_id: number) =>
  api.delete(`/goals/${goal_id}`);

export const getSpendingBreakdown = () =>
  api.get('/dashboard/spending-breakdown');

export const getNudgeSuccess = () =>
  api.get('/dashboard/nudge-success');

export const getGoalProgress = () =>
  api.get('/dashboard/goal-progress');

export const getTimeRisk = () =>
  api.get('/dashboard/time-risk');

export const sendChatMessage = (message: string) =>
  api.post('/nudge/chat', { message });

export const getFixedExpenses = () => api.get('/dashboard/fixed-expenses');

export const createFixedExpense = (data: { name: string; amount: number; category: string; due_day: number }) =>
  api.post('/dashboard/fixed-expenses', data);

export const updateFixedExpense = (id: number, data: { name?: string; amount?: number; category?: string; due_day?: number }) =>
  api.patch(`/dashboard/fixed-expenses/${id}`, data);

export const deleteFixedExpense = (id: number) =>
  api.delete(`/dashboard/fixed-expenses/${id}`);

export default api;
