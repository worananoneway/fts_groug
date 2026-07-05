import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.delete("/:ms_plate_id", controller.soft_delete);
    fastify.get("/", controller.get);
    fastify.get("/:ms_plate_id", controller.get);
    fastify.put("/:ms_plate_id", controller.update);
    fastify.patch("/status/:ms_plate_id", controller.update_status);
}