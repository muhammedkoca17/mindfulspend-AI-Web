export interface User {
  id: number;
  email: string;
  full_name: string;
  monthly_salary: number;
  onboarding_completed: boolean;
  risk_profile: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
}

export interface Transaction {
  id: number;
  item_name: string;
  amount: number;
  category: string;
  is_essential: boolean;
  impulsive_score: number;
  nudge_accepted: boolean;
  created_at: string;
}

export interface AnalysisResult {
  impulsive_score: number;
  is_impulsive: boolean;
  budget_risk: number;
  nudge_acceptance_prob: number;
  recommendation: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  is_essential: boolean;
}

export interface CartItem {
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
}
