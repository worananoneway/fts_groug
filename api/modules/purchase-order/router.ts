import type { FastifyInstance } from "fastify";
import controller from "./controller";

async function purchase_order_router(fastify: FastifyInstance) {
    fastify.get("/", controller.get);
    fastify.get("/:po_id", controller.get);
    fastify.post("/", controller.create);
    fastify.delete("/:po_id", controller.soft_delete);
    fastify.put("/:po_id", controller.update);
    fastify.patch("/status/:po_id", controller.update_status);
    
}

export default purchase_order_router;
