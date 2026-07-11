import { reply_options } from './model';
import service from './service';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    ProjectStatus
} from '@/api/utils/shared_types';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
const module_name = 'Address';
async function get_provinces(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        
        emp_authentication(module_name, user, reply);

        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_provinces(conditions);
        return reply.code(HttpStatusCode.OK).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during getting Province:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function get_districts(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        
        emp_authentication(module_name, user, reply);

        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_districts(conditions);
        return reply.code(HttpStatusCode.OK).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during getting District:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function get_subdistricts(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const user = request.user;
        
        emp_authentication(module_name, user, reply);

        const conditions: Condition = { sql: '', params: [] };

        const results = await service.get_subdistricts(conditions);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during getting subdistricts:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
export default {
    get_provinces,
    get_districts,
    get_subdistricts
};