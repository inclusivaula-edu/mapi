import { supabase } from '../services/supabase.js';

export const createProduct = async (req, res) => {
  const { supplier_id, name, category, price, stock } = req.body;

  const { data, error } = await supabase
    .from('logistics.products')
    .insert([{ supplier_id, name, category, price, stock }])
    .select();

  if (error) return res.status(400).json({ error });

  return res.json(data);
};

export const getProducts = async (req, res) => {
  const { data, error } = await supabase
    .from('logistics.products')
    .select('*');

  if (error) return res.status(400).json({ error });

  return res.json(data);
};