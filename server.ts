import dotenv from "dotenv";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import next from "next";

dotenv.config();
//build server
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const server = fastify({ logger: true, ignoreTrailingSlash: true });

app.prepare().then(async () => {
    //register plugins

    //register routes
    server.register(import("./api/modules/customer/router"), {
        prefix: "/api/:version/accounting/customers"
    });

    // server.register(import("../tfs_groug/api/modules/employee/router"), {
    //     prefix: "/api/:version/hrm-payroll/employees"
    // });

    server.register(import("./api/modules/address/router"), {
        prefix: "/api/:version/addresses"
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
        port: 3000,
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
