export interface Transaction {
  id?: number;
  raw_text: string;
  amount: number;
  category: string;
  currency: string;
  created_at?: string;
}
