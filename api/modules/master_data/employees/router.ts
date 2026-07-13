import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/", controller.get);
    fastify.get("/:emp_id", controller.get);
}
