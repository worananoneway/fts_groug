import type { FastifyInstance } from "fastify";
import controller from "./controller";

export default async function timeline_wsrbs_router(fastify: FastifyInstance) {
    fastify.post("/", controller.create);
    fastify.get("/", controller.get);
    fastify.get("/:timeline_wsrb_id", controller.get);
}
