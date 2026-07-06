import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/", controller.get);
    fastify.get("/:project_id", controller.get);
    fastify.post("/", controller.create);
    fastify.put("/:project_id", controller.update);
}