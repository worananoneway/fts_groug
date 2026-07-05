import controller from "./controller";

export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.delete("/:customer_id", controller.soft_delete);
    fastify.get("/", controller.get);
    fastify.get("/:customer_id", controller.get);
    fastify.put("/:customer_id", controller.update);
    fastify.patch("/status/:customer_id", controller.update_status);
}