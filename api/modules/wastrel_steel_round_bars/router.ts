import controller from "./controller";
import { FastifyInstance } from "fastify";

export default async function wastrel_steel_round_bars_router(fastify: FastifyInstance) {
    fastify.post("/", controller.create);
    fastify.get("/", controller.get);
    fastify.get("/:wsrb_id", controller.get);
    fastify.put("/:wsrb_id", controller.update);
    fastify.patch("/status/:wsrb_id", controller.update_status);
}
