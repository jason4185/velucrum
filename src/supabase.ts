import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface HolderRecord {
  id?: number;
  wallet_address: string;
  name: string;
  tranche_label: string;
  description: string;
  registered_at?: string;
}

export const addHolder = async (holder: HolderRecord) => {
  const { data, error } = await supabase.from('holders').insert([holder]);
  return { data, error };
};

export const getHolders = async () => {
  const { data, error } = await supabase.from('holders').select('*').order('registered_at', { ascending: false });
  return { data, error };
};

export const getHolderByWallet = async (wallet: string) => {
  const { data, error } = await supabase.from('holders').select('*').eq('wallet_address', wallet.toLowerCase()).single();
  return { data, error };
};
