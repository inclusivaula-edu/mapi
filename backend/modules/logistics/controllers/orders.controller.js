import { supabase } from '../services/supabase.js';

export const createOrder = async (req, res) => {
  const { customer_id, total_price } = req.body;

  const { data, error } = await supabase
    .from('logistics.orders')
    .insert([{ customer_id, total_price }])
    .select();

  if (error) return res.status(400).json({ error });

  return res.json(data);
};

export const getOrders = async (req, res) => {
  const { data, error } = await supabase
    .from('logistics.orders')
    .select('*');

  if (error) return res.status(400).json({ error });

  return res.json(data);
};