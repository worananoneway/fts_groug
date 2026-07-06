import controller from "./controller";
import { FastifyInstance } from "fastify";
import type {
    WastrelSteelRoundBarBody,
    WastrelSteelRoundBarParams,
    WastrelSteelRoundBarQuery
} from "./controller";

type WastrelSteelRoundBarRoute = {
    Params: WastrelSteelRoundBarParams;
    Querystring: WastrelSteelRoundBarQuery;
    Body: WastrelSteelRoundBarBody;
};

export default async function wastrelSteelRoundBarsRouter(fastify: FastifyInstance) {
    fastify.post<WastrelSteelRoundBarRoute>("/", controller.create);
    fastify.get<WastrelSteelRoundBarRoute>("/", controller.get);
    fastify.get<WastrelSteelRoundBarRoute>("/:wsrb_id", controller.get);
    fastify.put<WastrelSteelRoundBarRoute>("/:wsrb_id", controller.update);
    fastify.patch<WastrelSteelRoundBarRoute>("/status/:wsrb_id", controller.update_status);
}
