import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import field_validator from '@/api/utils/field_validator';
import service from "./service";
import {
    ErrorField,
    ErrorMessage,
    LocationType,
    Payload,
    StockStatus,
    ValidationError
} from "./type";

import { get_enum_keys, is_enum_key } from "@/api/utils/enum_checker";
import { sanitize_input, sanitize_payload, sanitize_string } from "@/api/utils/input_sanitizer";
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
} from "@/api/utils/shared_types";

const location_type_enum = get_enum_keys(LocationType);
const status_enum = get_enum_keys(StockStatus);
const module_name = "Wastrel MS Plate";

async function create(request: any, reply: any) {
    try {
        const emp_id: string = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const sanitized_body = sanitize_payload(request.body);
        const payload: Payload = request.body;
        console.log("[Controller] Creating wastrel MS plate with payload:", payload);

        const requiredKeys = [
            'cus_id',
            'due_date',
            'issue_date',
            'ship_via',
            'qt_on',
            'shipping_terms',
            'tax_rate',
            'recipient_id',
            'comment',
            'status_sent_date',
            'status_goods_received_',
            'status_paid_date',
            'status_note',
            'remark',
            'project_id',
            'condition_paid',
            'delivery_province_id',
            'delivery_district_id',
            'delivery_subdistrict_id',
            'approved_by_emp_id',
            'purchasing_fname',
            'purchasing_lname'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const invalid_fields: ValidationError[] = [];

        if ( ) {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }

        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel MS plate creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const duplicate_check = await service.count_duplicate({ sql: "", params: [payload.stock_code] });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(duplicate_check.statuscode).send(<Reply>
                reply_result(module_name, duplicate_check.statuscode, duplicate_check?.data)
            );
        }

        const result = await service.create(payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode, null, result?.data, reply_options)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during creating wastrel MS plate:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

async function get(request: any, reply: any) {
    try {

        emp_authentication(module_name, request?.user?.id, reply);

        const fields: string = request.reply_fields;
        const conditions: Condition = { sql: "", params: [] };
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
        if (request.query.stock_code) {
            conditions.params.push(sanitize_input(request.query.stock_code));
            conditions.sql += ` AND wmsp_stock_code = $${conditions.params.length} `;
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
        console.error("[Controller] An error occurred during getting wastrel MS plates:", error);
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
            'cus_id',
            'due_date',
            'issue_date',
            'ship_via',
            'qt_on',
            'shipping_terms',
            'tax_rate',
            'recipient_id',
            'comment',
            'status_sent_date',
            'status_goods_received_',
            'status_paid_date',
            'status_note',
            'remark',
            'project_id',
            'condition_paid',
            'delivery_province_id',
            'delivery_district_id',
            'delivery_subdistrict_id',
            'approved_by_emp_id',
            'purchasing_fname',
            'purchasing_lname'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const payload: Payload = request.body;
        const invalid_fields: ValidationError[] = [];

        if (!payload. ) {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }
        if () {
            invalid_fields.push({
                field: ErrorField.,
                message: ErrorMessage.
            });
        }

        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel MS plate creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }

        const duplicate_check = await service.count_duplicate({
            sql: " AND wmsp_id != $2",
            params: [payload.stock_code, id]
        });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(duplicate_check.statuscode).send(<Reply>
                reply_result(module_name, duplicate_check.statuscode)
            );
        }
        const dupplicate_count = duplicate_check?.data?.[0]?.duplicate_stock_code;
        if (dupplicate_count.duplicate_stock_code > 0) {
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>
                reply_result(module_name, HttpStatusCode.CONFLICT, [{
                    field: ErrorField.STOCK_CODE,
                    message: ErrorMessage.STOCK_CODE_DUPLICATE
                }])
            );
        }

        const result = await service.update(id, payload, emp_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error("[Controller] An error occurred during updating wastrel MS plate:", error);
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
        const payload = request.body?.status;

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
        console.error("[Controller] An error occurred during updating wastrel MS plate status:", error);
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
