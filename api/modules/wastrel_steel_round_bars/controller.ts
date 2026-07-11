import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import field_validator from '@/api/utils/field_validator';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    StockStatus,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_input, sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import {
    Condition,
    HttpStatusCode,
    Reply,
} from '@/api/utils/shared_types';

const status_enum = get_enum_keys(StockStatus);
const module_name = 'WastrelSteelRoundBar';

async function create(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const payload: Payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating wastrel steel round bar with payload:`, payload);

        const requiredKeys = [
            'mm_id',
            'srb_id',
            'code',
            'diameter',
            'length',
            'quantity',
            'available_quantity',
            'po_id',
            'podetail_id',
            'remark'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const invalid_fields: ValidationError[] = [];

        if (payload.mm_id && payload.mm_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.MM_ID,
                message: ErrorMessage.MM_ID_MAX_LENGTH
            });
        }
        if (payload.srb_id && payload.srb_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.SRB_ID,
                message: ErrorMessage.SRB_ID_MAX_LENGTH
            });
        }
        if (payload.code && payload.code.length > 50) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_MAX_LENGTH
            });
        }
        if (typeof payload.diameter !== 'number' || payload.diameter <= 0) {
            invalid_fields.push({
                field: ErrorField.DIAMETER,
                message: ErrorMessage.DIAMETER_INVALID
            });
        }
        if (typeof payload.length !== 'number' || payload.length <= 0) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_INVALID
            });
        }
        if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_INVALID
            });
        }
        if (!Number.isInteger(payload.available_quantity) || payload.available_quantity < 0 || payload.available_quantity > payload.quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_INVALID
            });
        }
        if (payload.po_id && payload.po_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.PO_ID,
                message: ErrorMessage.PO_ID_MAX_LENGTH
            });
        }
        if (payload.podetail_id && payload.podetail_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.PODETAIL_ID,
                message: ErrorMessage.PODETAIL_ID_MAX_LENGTH
            });
        }

        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in wastrel steel round bar creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during creating wastrel steel round bar:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

async function get(request: any, reply: any) {
    try {

        emp_authentication(module_name, request?.user?.id, reply);

        const fields: string = request.reply_fields || `*`;
        const conditions: Condition = { sql: ``, params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.params.wsrb_id) {
            conditions.params.push(sanitize_string(request.params.wsrb_id));
            conditions.sql += ` AND wsrb_id = $${conditions.params.length} `;
        }
        if (request.query.mm_id) {
            conditions.params.push(sanitize_input(request.query.mm_id));
            conditions.sql += ` AND wsrb_mm_id = $${conditions.params.length} `;
        }
        if (request.query.srb_id) {
            conditions.params.push(sanitize_input(request.query.srb_id));
            conditions.sql += ` AND wsrb_srb_id = $${conditions.params.length} `;
        }
        if (request.query.po_id) {
            conditions.params.push(sanitize_input(request.query.po_id));
            conditions.sql += ` AND wsrb_po_id = $${conditions.params.length} `;
        }
        if (request.query.podetail_id) {
            conditions.params.push(sanitize_input(request.query.podetail_id));
            conditions.sql += ` AND wsrb_podetail_id = $${conditions.params.length} `;
        }
        if (request.query.code) {
            conditions.params.push(sanitize_input(request.query.code));
            conditions.sql += ` AND wsrb_code = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(StockStatus[request.query.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof StockStatus]);
            conditions.sql += ` AND wsrb_status = $${conditions.params.length} `;
        } else if (request.query.status) {
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
        console.error(`[Controller] An error occurred during getting wastrel steel round bars:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null)
        );
    }
}

async function update(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);

        const id = sanitize_string(request?.params.wsrb_id);
        if (!id) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.PARAM_ID,
                    message: ErrorMessage.PARAM_ID_REQUIRED
                }])
            );
        }

        const requiredKeys = [
            'mm_id',
            'srb_id',
            'code',
            'diameter',
            'length',
            'quantity',
            'available_quantity',
            'po_id',
            'podetail_id',
            'remark'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const payload: Payload = sanitize_payload(request.body);
        const invalid_fields: ValidationError[] = [];

        if (payload.mm_id && payload.mm_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.MM_ID,
                message: ErrorMessage.MM_ID_MAX_LENGTH
            });
        }
        if (payload.srb_id && payload.srb_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.SRB_ID,
                message: ErrorMessage.SRB_ID_MAX_LENGTH
            });
        }
        if (payload.code && payload.code.length > 50) {
            invalid_fields.push({
                field: ErrorField.CODE,
                message: ErrorMessage.CODE_MAX_LENGTH
            });
        }
        if (typeof payload.diameter !== 'number' || payload.diameter <= 0) {
            invalid_fields.push({
                field: ErrorField.DIAMETER,
                message: ErrorMessage.DIAMETER_INVALID
            });
        }
        if (typeof payload.length !== 'number' || payload.length <= 0) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_INVALID
            });
        }
        if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
            invalid_fields.push({
                field: ErrorField.QUANTITY,
                message: ErrorMessage.QUANTITY_INVALID
            });
        }
        if (!Number.isInteger(payload.available_quantity) || payload.available_quantity < 0 || payload.available_quantity > payload.quantity) {
            invalid_fields.push({
                field: ErrorField.AVAILABLE_QUANTITY,
                message: ErrorMessage.AVAILABLE_QUANTITY_INVALID
            });
        }
        if (payload.po_id && payload.po_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.PO_ID,
                message: ErrorMessage.PO_ID_MAX_LENGTH
            });
        }
        if (payload.podetail_id && payload.podetail_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.PODETAIL_ID,
                message: ErrorMessage.PODETAIL_ID_MAX_LENGTH
            });
        }

        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in wastrel steel round bar creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.update(id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating wastrel steel round bar:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

async function update_status(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const invalid_fields: ValidationError[] = [];
        const id = sanitize_string(request.params.wsrb_id);

        const payload = sanitize_payload(request.body);
        if (!is_enum_key(status_enum, payload.status?.trim().replace(/\s+/g, '_').toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else {
            payload.status = StockStatus[payload.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof StockStatus];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.update_status(id, payload.status, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating wastrel steel round bar status:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

const controller = {
    create,
    get,
    update,
    update_status
};

export default controller;
