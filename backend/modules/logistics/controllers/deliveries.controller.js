import { supabase } from '../services/supabase.js';

export const createDelivery = async (req, res) => {
  const { order_id, driver_name, estimated_time } = req.body;

  const { data, error } = await supabase
    .from('logistics.deliveries')
    .insert([{ order_id, driver_name, estimated_time }])
    .select();

  if (error) return res.status(400).json({ error });

  return res.json(data);
};