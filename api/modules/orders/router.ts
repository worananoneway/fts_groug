import type { FastifyInstance } from "fastify";

import controller from "./controller";

export default async function ordersRouter(fastify: FastifyInstance) {
    fastify.get("/", controller.get);
    fastify.get("/:ord_id", controller.get);
    fastify.patch("/:ord_id/status", controller.update_order_status);
    fastify.patch("/details/:odd_id/status", controller.update_order_detail_status);
}
