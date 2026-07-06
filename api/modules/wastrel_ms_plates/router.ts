import controller from "./controller";
import { FastifyInstance } from "fastify";
import type {
    WastrelMSPlateBody,
    WastrelMSPlateParams,
    WastrelMSPlateQuery
} from "./controller";

type WastrelMSPlateRoute = {
    Params: WastrelMSPlateParams;
    Querystring: WastrelMSPlateQuery;
    Body: WastrelMSPlateBody;
};

export default async function wastrelMSPlatesRouter(fastify: FastifyInstance) {
    fastify.post<WastrelMSPlateRoute>("/", controller.create);
    fastify.get<WastrelMSPlateRoute>("/", controller.get);
    fastify.get<WastrelMSPlateRoute>("/:wmsp_id", controller.get);
    fastify.put<WastrelMSPlateRoute>("/:wmsp_id", controller.update);
    fastify.patch<WastrelMSPlateRoute>("/status/:wmsp_id", controller.update_status);
}
