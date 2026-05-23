import { supabase } from "../../../services/dbService.js";

export default async function supplierRoutes(fastify) {

  // =============================
  // 📦 LISTAR FORNECEDORES
  // =============================
  fastify.get("/suppliers", async (request, reply) => {

    try {

      const { data, error } = await supabase
        .from("suppliers")
        .select("*");

      if (error) {

        console.error(error);

        return reply.code(500).send({
          error: "Erro ao buscar fornecedores"
        });

      }

      return data;

    } catch (err) {

      console.error(err);

      return reply.code(500).send({
        error: "Erro interno"
      });

    }

  });

}