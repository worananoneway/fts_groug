import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.create);
    fastify.get("/", controller.get);
    fastify.get("/:tlwmsp_id", controller.get);
}
