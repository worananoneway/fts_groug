import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/", controller.get);
    fastify.get("/:supplier_id", controller.get);
    fastify.post("/", controller.create);
    fastify.put("/:supplier_id", controller.update);
    fastify.patch("/status/:supplier_id", controller.update_status);
    fastify.delete("/:supplier_id", controller.soft_delete);
}