import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import field_validator from '@/api/utils/field_validator';
import service from "./service";
import {
    ErrorField,
    ErrorMessage,
    Payload,
    StockStatus,
    ValidationError
} from "./type";

import { get_enum_keys, is_enum_key } from "@/api/utils/enum_checker";
import { sanitize_input, sanitize_payload, sanitize_string } from "@/api/utils/input_sanitizer";
import {
    Condition,
    HttpStatusCode,
    Reply,
} from "@/api/utils/shared_types";

const status_enum = get_enum_keys(StockStatus);
const module_name = "Wastrel MS Plate";

async function create(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const payload: Payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating wastrel MS plate with payload:`, payload);

        const requiredKeys = [
            'mm_id',
            'msp_id',
            'length',
            'width',
            'thickness',
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
        if (payload.msp_id && payload.msp_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.MSP_ID,
                message: ErrorMessage.MSP_ID_MAX_LENGTH
            });
        }
        if (typeof payload.length !== 'number' || payload.length <= 0) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_INVALID
            });
        }
        if (typeof payload.width !== 'number' || payload.width <= 0) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_INVALID
            });
        }
        if (typeof payload.thickness !== 'number' || payload.thickness <= 0) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_INVALID
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
            console.error(`[Controller] Validation errors found in wastrel MS plate creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during creating wastrel MS plate:`, error);
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

        if (request.params.wmsp_id) {
            conditions.params.push(sanitize_string(request.params.wmsp_id));
            conditions.sql += ` AND wmsp_id = $${conditions.params.length} `;
        }
        if (request.query.mm_id) {
            conditions.params.push(sanitize_input(request.query.mm_id));
            conditions.sql += ` AND wmsp_mm_id = $${conditions.params.length} `;
        }
        if (request.query.msp_id) {
            conditions.params.push(sanitize_input(request.query.msp_id));
            conditions.sql += ` AND wmsp_msp_id = $${conditions.params.length} `;
        }
        if (request.query.po_id) {
            conditions.params.push(sanitize_input(request.query.po_id));
            conditions.sql += ` AND wmsp_po_id = $${conditions.params.length} `;
        }
        if (request.query.podetail_id) {
            conditions.params.push(sanitize_input(request.query.podetail_id));
            conditions.sql += ` AND wmsp_podetail_id = $${conditions.params.length} `;
        }
        if (request.query.display_id) {
            conditions.params.push(sanitize_input(request.query.display_id));
            conditions.sql += ` AND wmsp_display_id = $${conditions.params.length} `;
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(StockStatus[request.query.status.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof StockStatus]);
            conditions.sql += ` AND wmsp_status = $${conditions.params.length} `;
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
        console.error(`[Controller] An error occurred during getting wastrel MS plates:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR, null)
        );
    }
}

async function update(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);

        const id = sanitize_string(request?.params.wmsp_id);
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
            'msp_id',
            'length',
            'width',
            'thickness',
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
        if (payload.msp_id && payload.msp_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.MSP_ID,
                message: ErrorMessage.MSP_ID_MAX_LENGTH
            });
        }
        if (typeof payload.length !== 'number' || payload.length <= 0) {
            invalid_fields.push({
                field: ErrorField.LENGTH,
                message: ErrorMessage.LENGTH_INVALID
            });
        }
        if (typeof payload.width !== 'number' || payload.width <= 0) {
            invalid_fields.push({
                field: ErrorField.WIDTH,
                message: ErrorMessage.WIDTH_INVALID
            });
        }
        if (typeof payload.thickness !== 'number' || payload.thickness <= 0) {
            invalid_fields.push({
                field: ErrorField.THICKNESS,
                message: ErrorMessage.THICKNESS_INVALID
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
            console.error(`[Controller] Validation errors found in wastrel MS plate creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.update(id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating wastrel MS plate:`, error);
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
        const id = sanitize_string(request.params.wmsp_id);

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
        console.error(`[Controller] An error occurred during updating wastrel MS plate status:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

// PATCH พื้นที่จัดเก็บ — รับ { ids: string[], location: string|null }
async function update_location(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);

        const body = sanitize_payload(request.body ?? {});
        const ids: string[] = Array.isArray(body.ids) ? body.ids.map((v: unknown) => String(v)) : [];
        const location: string | null = body.location ? String(body.location).trim() : null;

        if (ids.length === 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, ['ids'])
            );
        }
        const result = await service.update_location(ids, location, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name} location:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

// PATCH วัน-เวลาที่กำหนด — รับ { ids: string[], scheduled_at: string|null }
async function update_schedule(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;
        emp_authentication(module_name, emp_id, reply);

        const body = sanitize_payload(request.body ?? {});
        const ids: string[] = Array.isArray(body.ids) ? body.ids.map((v: unknown) => String(v)) : [];
        // ค่าว่าง/null = ล้างวัน-เวลาที่กำหนด
        const scheduled_at: string | null = body.scheduled_at ? String(body.scheduled_at).trim() || null : null;

        if (ids.length === 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, ['ids'])
            );
        }

        const invalid_fields: ValidationError[] = [];
        if (scheduled_at !== null && Number.isNaN(Date.parse(scheduled_at))) {
            invalid_fields.push({
                field: ErrorField.SCHEDULED_AT,
                message: ErrorMessage.SCHEDULED_AT_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} schedule payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const result = await service.update_schedule(ids, scheduled_at, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name} scheduled_at:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

const controller = {
    create,
    get,
    update,
    update_status,
    update_location,
    update_schedule
};

export default controller;
