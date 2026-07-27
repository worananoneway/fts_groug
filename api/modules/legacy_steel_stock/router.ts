import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/round-bars", controller.get_round_bars);
    fastify.get("/plates", controller.get_plates);
}
