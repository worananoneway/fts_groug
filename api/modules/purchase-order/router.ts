import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/", controller.get);
    fastify.get("/:po_id", controller.get);
    fastify.post("/", controller.create);
    // fastify.post("/po-rev/", controller.create_rev);    
    fastify.put("/:po_id", controller.update);
    fastify.patch("/status/:po_id", controller.update_status);
}