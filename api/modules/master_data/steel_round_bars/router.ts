import stlroundbar from "./controller";

export default async function (fastify: any, opts: any) {
    fastify.post("/", stlroundbar.create);
    fastify.delete("/:srb_id", stlroundbar.soft_delete);
    fastify.get("/", stlroundbar.get);
    fastify.get("/:srb_id", stlroundbar.get);
    fastify.put("/:srb_id", stlroundbar.update);
    fastify.patch("/status/:srb_id", stlroundbar.update_status);
}