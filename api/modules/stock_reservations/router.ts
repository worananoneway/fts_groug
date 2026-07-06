import controller from "./controller";
import { FastifyInstance } from "fastify";

async function stock_reservations_router(fastify: FastifyInstance) {
    fastify.post("/", controller.create);
    fastify.delete("/:sr_id", controller.soft_delete);
    fastify.get("/", controller.get);
    fastify.get("/:sr_id", controller.get);
}

export default stock_reservations_router;
