import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import service from "./service";
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ReservationStatus,
    ReservationStockType,
    ValidationError
} from "./type";

import { get_enum_keys, is_enum_key } from "@/api/utils/enum_checker";
import { sanitize_payload, sanitize_string } from "@/api/utils/input_sanitizer";
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
} from "@/api/utils/shared_types";
import { FastifyReply, FastifyRequest } from "fastify";

const stock_type_enum = get_enum_keys(ReservationStockType);
const reservation_status_enum = get_enum_keys(ReservationStatus);
const module_name = `Stock Reservation`;

async function create(request: any, reply: any) {
    try {

        const lang = request.headers['accept-language'] || 'en-US';
        const emp_id = request.user?.id;

        emp_authentication(module_name, emp_id, reply);
        
        const payload: Payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating ${module_name} with payload:`, payload);

        const invalid_fields: ValidationError[] = [];
        if (!payload.po_id) {
            invalid_fields.push({
                field: ErrorField.po_id,
                message: ErrorMessage.po_id_REQUIRED
            });
        }
        if (!payload.podetail_id) {
            invalid_fields.push({
                field: ErrorField.podetail_id,
                message: ErrorMessage.podetail_id_REQUIRED
            });
        }
        if (!payload.stock_type) {
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_REQUIRED
            });
        }
        if (!payload.stock_id) {
            invalid_fields.push({
                field: ErrorField.STOCK_ID,
                message: ErrorMessage.STOCK_ID_REQUIRED
            });
        }
        if (payload.stock_type && !is_enum_key(stock_type_enum, payload.stock_type?.trim().replace(/\s+/g, '_').toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        } else {
            payload.stock_type = ReservationStockType[payload.stock_type.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof ReservationStockType];
        }

        if (payload.status && !is_enum_key(reservation_status_enum, payload.status?.trim().replace(/\s+/g, '_').toUpperCase())) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else if (payload.status) {
            payload.status = ReservationStatus[payload.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof ReservationStatus];
        }

        if (payload.reserved_quantity && payload.reserved_quantity <= 0) {
            invalid_fields.push({
                field: ErrorField.RESERVED_QUANTITY,
                message: ErrorMessage.RESERVED_QUANTITY_INVALID
            });
        }
        if (payload.reserved_length_mm && payload.reserved_length_mm <= 0) {
            invalid_fields.push({
                field: ErrorField.RESERVED_LENGTH_MM,
                message: ErrorMessage.RESERVED_LENGTH_MM_INVALID
            });
        }

        if (payload.reserved_width_mm && payload.reserved_width_mm <= 0) {
            invalid_fields.push({
                field: ErrorField.RESERVED_WIDTH_MM,
                message: ErrorMessage.RESERVED_WIDTH_MM_INVALID
            });
        }

        if(invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }


        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data)
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
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);
        const fields: string = request.reply_fields || '*';
        const conditions: Condition = { sql: ``, params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.params.sr_id) {
            conditions.params.push(sanitize_string(request.params.sr_id));
            conditions.sql += ` AND sr.sr_id = $${conditions.params.length} `;
        }
        if (request.query.po_id) {
            conditions.params.push(sanitize_string(request.query.po_id));
            conditions.sql += ` AND sr.sr_po_id = $${conditions.params.length} `;
        }
        if (request.query.podetail_id) {
            conditions.params.push(sanitize_string(request.query.podetail_id));
            conditions.sql += ` AND sr.sr_podetail_id = $${conditions.params.length} `;
        }
        if (request.query.stock_id) {
            conditions.params.push(sanitize_string(request.query.stock_id));
            conditions.sql += ` AND sr.sr_stock_id = $${conditions.params.length} `;
        }
        if (request.query.stock_type && is_enum_key(stock_type_enum, request.query.stock_type?.trim().replace(/\s+/g, '_').toUpperCase())) {
            conditions.params.push(ReservationStockType[request.query.stock_type?.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof ReservationStockType]);
            conditions.sql += ` AND sr.sr_stock_type = $${conditions.params.length} `;
        } else {
            console.error(`[Controller] Invalid stock_type enum value provided for ${module_name}:`, request.query.stock_type);
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        }
        if (request.query.status && is_enum_key(reservation_status_enum, request.query.status?.trim().replace(/\s+/g, '_').toUpperCase())) {
            conditions.params.push(ReservationStatus[request.query.status?.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof ReservationStatus]);
            conditions.sql += ` AND sr.sr_status = $${conditions.params.length} `;
        } else {
            console.error(`[Controller] Invalid status enum value provided for ${module_name}:`, request.query.status);
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
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        if (!request.params.sr_id) {
            console.error(`[Controller] Missing ${module_name} ID for deletion.`);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.ID,
                    message: ErrorMessage.ID_REQUIRED
                }])
            );
        }

        const sr_id = sanitize_string(request.params.sr_id);

        const result = await service.soft_delete(sr_id, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result.data)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

const controller = {
    create,
    get,
    soft_delete
};

export default controller;
