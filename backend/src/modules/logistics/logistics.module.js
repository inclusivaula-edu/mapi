import supplierRoutes from "./routes/suppliers.routes.js";

export default async function logisticsModule(fastify) {

  fastify.register(supplierRoutes);

}