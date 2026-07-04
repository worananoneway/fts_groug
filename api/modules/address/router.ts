import controller from "./controller";
export default async function (fastify: any, opts: any) {
    fastify.get("/province", controller.get_provinces);
    fastify.get("/district", controller.get_districts);
    fastify.get("/subdistrict", controller.get_subdistricts);
}