import controller from "./controller";
import { FastifyInstance } from "fastify";

export default async function locations_router(fastify: FastifyInstance) {
    fastify.get("/", controller.get);
    fastify.get("/:loc_id", controller.get);
    fastify.post("/", controller.create);
    fastify.put("/:loc_id", controller.update);
    fastify.delete("/:loc_id", controller.soft_delete);
}
