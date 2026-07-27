import service from "./service";
import { HttpStatus, HttpStatusCode, Reply } from "@/api/utils/shared_types";

const module_name = "Legacy Steel Stock";

async function get_round_bars(request: any, reply: any) {
    try {
        const result = await service.get_round_bars();
        return reply.code(result.statuscode).send(<Reply>{
            status: result.statuscode === HttpStatusCode.OK ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: result.statuscode,
            details: result.data ?? [],
        });
    } catch (error) {
        console.error(`[Controller] error getting ${module_name} round bars:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: { error: "internal_server_error" },
        });
    }
}

async function get_plates(request: any, reply: any) {
    try {
        const result = await service.get_plates();
        return reply.code(result.statuscode).send(<Reply>{
            status: result.statuscode === HttpStatusCode.OK ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: result.statuscode,
            details: result.data ?? [],
        });
    } catch (error) {
        console.error(`[Controller] error getting ${module_name} plates:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: { error: "internal_server_error" },
        });
    }
}

export default { get_round_bars, get_plates };
