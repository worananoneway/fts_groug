import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.delete("/:podetail_id", controller.soft_delete);
    fastify.put("/", controller.update);
}