import { supabase } from "../services/dbService.js";

export async function getUser(req, reply) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return reply.code(401).send({ error: "Token não enviado" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.code(401).send({ error: "Usuário inválido" });
  }

  return data.user;
}