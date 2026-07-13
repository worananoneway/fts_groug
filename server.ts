import dotenv from "dotenv";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import next from "next";

dotenv.config();
//build server
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const server = fastify({
    logger: true,
    routerOptions: {
        ignoreTrailingSlash: true
    }
});

app.prepare().then(async () => {
    //register plugins

    //register routes
    server.register(import("./api/modules/master_data/customer/router"), {
        prefix: "/api/:version/customers"
    });

    server.register(import("./api/modules/master_data/steel_round_bars/router"), {
        prefix: "/api/:version/steel-round-bars"
    });

    server.register(import("./api/modules/wastrel_steel_round_bars/router"), {
        prefix: "/api/:version/wastrel-steel-round-bars"
    });

    server.register(import("./api/modules/wastrel_ms_plates/router"), {
        prefix: "/api/:version/wastrel-ms-plates"
    });

    server.register(import("./api/modules/master_data/ms_plates/router"), {
        prefix: "/api/:version/ms-plates"
    });

    server.register(import("./api/modules/timeline_msps/router"), {
        prefix: "/api/:version/timeline-msps"
    });

    server.register(import("./api/modules/timeline_srbs/router"), {
        prefix: "/api/:version/timeline-srbs"
    });

    server.register(import("./api/modules/timeline_wsrbs/router"), {
        prefix: "/api/:version/timeline-wsrbs"
    });

    server.register(import("./api/modules/projects/router"), {
        prefix: "/api/:version/projects"
    });

    server.register(import("./api/modules/master_data/employees/router"), {
        prefix: "/api/:version/employees"
    });

    server.register(import("./api/modules/address/router"), {
        prefix: "/api/:version/addresses"
    });

    server.register(import("./api/modules/calculation_division/router"), {
        prefix: "/api/:version/calculation-division"
    });

    server.register(import("./api/modules/timeline_wmsps/router"), {
        prefix: "/api/:version/timeline-wmsps"
    });

    server.register(import("./api/modules/stock_reservations/router"), {
        prefix: "/api/:version/stock-reservations"
    });

    server.register(import("./api/modules/purchase_orders/router"), {
        prefix: "/api/:version/purchase-orders"
    });

    server.register(import("./api/modules/purchase-order-detail/router"), {
        prefix: "/api/:version/purchase-order-details"
    });

    server.all("/*", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await handle(request.raw, reply.raw);
            return reply;
        } catch (error) {
            console.error("Error handling request:", error);
            if (!reply.sent) {
                return reply.code(500).send("Internal Server Error");
            }
            return reply;
        }
    });

    server.listen({
        port: Number(process.env.PORT) || 3000,
        host: "0.0.0.0"
    }).then((address: string) => {
        console.log(` > Ready on ${address}`);
    }).catch((error: Error) => {
        console.error(error);
        process.exit(1);
    });
}).catch((error: Error) => {
    console.error(error);
    process.exit(1);
})
