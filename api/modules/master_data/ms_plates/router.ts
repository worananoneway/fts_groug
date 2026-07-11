import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.delete("/:msp_id", controller.soft_delete);
    fastify.get("/", controller.get);
    fastify.get("/:msp_id", controller.get);
    fastify.put("/:msp_id", controller.update);
    fastify.patch("/status/:msp_id", controller.update_status);
}