import { reply_options } from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_input, sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import { validate_digit, validate_email } from '@/api/utils/input_validator';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    Status,
    StockStatus
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';
import { emp_authentication } from '@/api/utils/controller_auth';
import { reply_result } from '@/api/utils/controller_replys'

const emp_id = null
const status_enum = get_enum_keys(StockStatus);

const module_name = '${module_name}';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id: string = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const payload: Payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating ${module_name} with payload:`, payload);
        const invalid_fields: ValidationError[] = [];

        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const duplicate_check = await service.count_duplicate({ sql: ' ', params: [payload.code] });
        if (duplicate_check.statuscode !== HttpStatusCode.OK || (duplicate_check.data && duplicate_check.data[0]?.duplicate_code > 0)) {
            return reply.code(duplicate_check.statuscode).send(<Reply>
                reply_result(module_name, duplicate_check.statuscode, Array.isArray(duplicate_check.error) ? duplicate_check.error : null)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during creating ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function get(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const fields: string = request.reply_fields;
        const conditions: Condition = { sql: '', params: [] };

        const invalid_fields: ValidationError[] = [];
        if (request.params.srb_id) {
            conditions.params.push(request.params.srb_id);
            conditions.sql += ` AND srb_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(StockStatus[request.query.status.toUpperCase() as keyof typeof StockStatus]);
            conditions.sql += ` AND srb_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error(`[Controller] Invalid Type enum of status value provided for ${module_name}: `, request.query.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const results = await service.get(conditions, fields);
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during getting ${module_name}s:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function soft_delete(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        if (!request.params.srb_id) {
            console.error(`[Controller] Missing ${module_name} ID for deletion.`);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.PARAM_ID,
                    message: ErrorMessage.PARAM_ID_REQUIRED
                }])
            );
        }
        const srb_id: string = sanitize_string(request.params.srb_id);
        const result = await service.soft_delete(srb_id, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const payload: Payload = sanitize_payload(request?.body);
        const srb_id: string = sanitize_string(request?.params?.srb_id);
        const srb_data = await service.get({ sql: ' AND srb_id = $1 ', params: [srb_id] });
        if (srb_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(srb_data.statuscode).send(<Reply>
                reply_result(module_name, srb_data.statuscode)
            );
        }
        const invalid_fields: ValidationError[] = [];
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} update payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const duplicate_check = await service.count_duplicate({ sql: ' AND srb_id != $2', params: [payload.code, srb_id] });
        if (duplicate_check.statuscode !== HttpStatusCode.OK || (duplicate_check.data && duplicate_check.data[0]?.duplicate_code > 0)) {
            return reply.code(duplicate_check.statuscode).send(<Reply>
                reply_result(module_name, duplicate_check.statuscode, Array.isArray(duplicate_check.error) ? duplicate_check.error : null)
            );
        }
        const result = await service.update(srb_id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update_status(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const missing_fields: string[] = field_validator(request?.body, [
            'status'
        ]);
        if (!request.params.srb_id) {
            missing_fields.unshift('id');
        }
        if (missing_fields.length > 0) {
            console.error(`[Controller] Missing required fields for updating ${module_name} status:`, missing_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }
        let status: string = sanitize_input(request.body.status);
        const invalid_fields: ValidationError[] = [];
        if (!is_enum_key(status_enum, status)) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            status = StockStatus[status.toUpperCase() as keyof typeof StockStatus];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} status update:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const srb_id: string = request.params.srb_id;
        const result = await service.update_status(srb_id, status, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name} status:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
export default {
    create,
    get,
    soft_delete,
    update,
    update_status
};