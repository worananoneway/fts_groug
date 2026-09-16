import controller from "./controller";
import { FastifyInstance } from "fastify";

export default async function wastrel_ms_plates_router(fastify: FastifyInstance) {
    fastify.post("/", controller.create);
    fastify.get("/", controller.get);
    fastify.get("/:wmsp_id", controller.get);
    fastify.put("/:wmsp_id", controller.update);
    fastify.patch("/status/:wmsp_id", controller.update_status);
    fastify.patch("/location", controller.update_location);
    fastify.patch("/schedule", controller.update_schedule);
}
