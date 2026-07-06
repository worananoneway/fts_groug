import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.post("/", controller.calculation_division);
}