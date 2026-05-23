import { supabase } from '../services/supabase.js';

export const createSupplier = async (req, res) => {
  const { name, type, location, phone } = req.body;

  const { data, error } = await supabase
    .from('logistics.suppliers')
    .insert([{ name, type, location, phone }])
    .select();

  if (error) return res.status(400).json({ error });

  return res.json(data);
};

export const getSuppliers = async (req, res) => {
  const { data, error } = await supabase
    .from('logistics.suppliers')
    .select('*');

  if (error) return res.status(400).json({ error });

  return res.json(data);
};