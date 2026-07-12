import type { FastifyInstance } from "fastify";

import controller from "./controller";

export default async function ordersRouter(fastify: FastifyInstance) {
    fastify.get("/", controller.get);
    fastify.get("/:po_id", controller.get);
    fastify.post("/:po_id/details", controller.create_order_detail);
    fastify.put("/details/:podetail_id", controller.update_order_detail);
    fastify.patch("/:po_id/status", controller.update_order_status);
    fastify.patch("/details/:podetail_id/status", controller.update_order_detail_status);
}
