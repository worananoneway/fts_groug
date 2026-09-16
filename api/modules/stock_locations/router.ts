import controller from "./controller";
import { FastifyInstance } from "fastify";

export default async function stock_locations_router(fastify: FastifyInstance) {
    fastify.get("/", controller.get);
    // UPSERT ด้วยคู่ (stock_type, stock_code) จึงไม่มี id ใน path
    fastify.put("/", controller.upsert);
    fastify.delete("/:sl_id", controller.soft_delete);
}
