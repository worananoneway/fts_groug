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
    BranchType,
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
    Status,
    TaxType,
} from '@/api/utils/shared_types';
import field_validator from '@/api/utils/field_validator';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';

const branch_type_enum = get_enum_keys(BranchType);
const status_enum = get_enum_keys(Status);
const tax_type_enum = get_enum_keys(TaxType);

const module_name = 'MS_Plates';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        
        emp_authentication(module_name, request.user, reply);

        const emp_id: string = request.user?.id; 
        const payload: Payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating ${module_name} with payload:`, payload);
        const invalid_fields: ValidationError[] = [];
        if (!payload.mm_id) {
            invalid_fields.push({
                field: ErrorField.MM_ID,
                message: ErrorMessage.MM_ID_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.length) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_REQUIRED
            });
        }
        if (!payload.width) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_REQUIRED
            });
        }
        if (!payload.thickness) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_REQUIRED
            });
        }
        if (!payload.quantity) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_REQUIRED
            });
        }
        if (!payload.available_quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_REQUIRED
            });
        }
        if (!payload.status) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_REQUIRED
            });
        }
        if (!payload.received_date) {
            invalid_fields.push({
                field: ErrorField.RECEIVED_DATE,
                message: ErrorMessage.RECEIVED_DATE_REQUIRED
            });
        }
        if (!payload.remark) {
            invalid_fields.push({
                field: ErrorField.REMARK,
                message: ErrorMessage.REMARK_REQUIRED
            });
        }
        if (!payload.created_at) {
            invalid_fields.push({
                field: ErrorField.CREATED_AT,
                message: ErrorMessage.CREATED_AT_REQUIRED
            });
        }
        if (!payload.updated_at) {
            invalid_fields.push({
                field: ErrorField.UPDATED_AT,
                message: ErrorMessage.UPDATED_AT_REQUIRED
            });
        }

        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found:`, invalid_fields);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, invalid_fields)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
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

        emp_authentication(module_name, request?.user, reply);
        const emp_id = request?.user?.id;
        const invalid_fields: ValidationError[] = [];
        if (request.params.msp_id) {
            conditions.params.push(request.params.msp_id);
            conditions.sql += ` AND msp_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND msp_status = $${conditions.params.length} `;
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
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        
        emp_authentication(module_name, request?.user, reply);

        const emp_id: string = request?.user?.id;
        const payload: Payload = sanitize_payload(request.body);
        const ms_plate_id: string = sanitize_string(request.params.ms_plate_id);
        const ms_plate_data = await service.get({ sql: ' AND msp_id = $1 ', params: [ms_plate_id] });
        if (ms_plate_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(ms_plate_data.statuscode).send(<Reply>
                reply_result(module_name, ms_plate_data.statuscode, null, ms_plate_data?.data, reply_options)
            );
        }
        const invalid_fields: ValidationError[] = [];
        if (!payload.mm_id) {
            invalid_fields.push({
                field: ErrorField.MM_ID,
                message: ErrorMessage.MM_ID_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.code) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_REQUIRED
            });
        }
        if (!payload.length) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_REQUIRED
            });
        }
        if (!payload.width) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_REQUIRED
            });
        }
        if (!payload.thickness) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_REQUIRED
            });
        }
        if (!payload.quantity) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_REQUIRED
            });
        }
        if (!payload.available_quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_REQUIRED
            });
        }
        if (!payload.loc_id) {
            invalid_fields.push({
                field: ErrorField.LOC_ID,
                message: ErrorMessage.LOC_ID_REQUIRED
            });
        }
        if (!payload.location_type) {
            invalid_fields.push({
                field: ErrorField.LOCATION_TYPE,
                message: ErrorMessage.LOCATION_TYPE_REQUIRED
            });
        }
        if (!payload.location) {
            invalid_fields.push({
                field: ErrorField.LOCATION,
                message: ErrorMessage.LOCATION_REQUIRED
            });
        }
        if (!payload.status) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_REQUIRED
            });
        }
        if (!payload.received_date) {
            invalid_fields.push({
                field: ErrorField.RECEIVED_DATE,
                message: ErrorMessage.RECEIVED_DATE_REQUIRED
            });
        }
        if (!payload.remark) {
            invalid_fields.push({
                field: ErrorField.REMARK,
                message: ErrorMessage.REMARK_REQUIRED
            });
        }
        if (!payload.created_at) {
            invalid_fields.push({
                field: ErrorField.CREATED_AT,
                message: ErrorMessage.CREATED_AT_REQUIRED
            });
        }
        if (!payload.updated_at) {
            invalid_fields.push({
                field: ErrorField.UPDATED_AT,
                message: ErrorMessage.UPDATED_AT_REQUIRED
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} update payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.update(ms_plate_id, payload, emp_id);
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
        
        emp_authentication(module_name, request?.user, reply);
        const emp_id: string = request?.user?.id;
        const missing_fields: string[] = field_validator(request.body, [
            'status'
        ]);
        if (!request.params.ms_plate_id) {
            missing_fields.unshift('ms_plate_id');
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
            status = Status[status.toUpperCase() as keyof typeof Status];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const ms_plate_id: string = request.params.ms_plate_id;
        const ms_plate_data = await service.get({ sql: ` AND ms_plate_id = $1`, params: [ms_plate_id] });
        if (ms_plate_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(ms_plate_data.statuscode).send(<Reply>
                reply_result(module_name, ms_plate_data.statuscode)
            );
        }
        const result = await service.update_status(ms_plate_id, status, emp_id);
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
async function soft_delete(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        
        emp_authentication(module_name, request?.user, reply);
        const emp_id: string = request?.user?.id;
        const ms_plate_id: string = request.params.ms_plate_id;
        let status: string = sanitize_input(request.body.status);
        const invalid_fields: ValidationError[] = [];
        if (!is_enum_key(status_enum, status) && status !== Status.DELETED) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_DELETED_INVALID
            });
        } else {
            status = Status[status.toUpperCase() as keyof typeof Status];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        const result = await service.soft_delete(ms_plate_id, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    }catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
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