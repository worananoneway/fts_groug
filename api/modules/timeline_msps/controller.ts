import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import service from "./service";
import {
    ErrorField,
    ErrorMessage,
    Payload,
    ValidationError,
} from "./type";

import { get_enum_keys, is_enum_key } from "@/api/utils/enum_checker";
import { sanitize_payload, sanitize_string } from "@/api/utils/input_sanitizer";
import {
    Condition,
    HttpStatusCode,
    Reply,
    Status,
    StockStatus,
    TimelineEventType,
} from "@/api/utils/shared_types";
import field_validator from '@/api/utils/field_validator';

const event_type_enum = get_enum_keys(TimelineEventType);
const stock_status_enum = get_enum_keys(StockStatus);

const module_name = `Timeline MS Plates`;

async function create(request: any, reply: any) {
    try {
        const emp_id = request?.user?.id;

        emp_authentication(module_name, emp_id, reply);

        const payload = sanitize_payload(request.body);
        console.log(`[Controller] Creating ${module_name} with payload:`, payload);

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
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        // if () {
        //     invalid_fields.push({
        //         field: ErrorField.,
        //         message: ErrorMessage.
        //     });
        // }
        if (!is_enum_key(event_type_enum, request.body.event_type)) {
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        } else {
            payload.event_type = TimelineEventType[request.body.event_type.toUpperCase() as keyof typeof TimelineEventType];
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        // switch (payload.event_type) {
        //     case TimelineEventType.ADD:
        //     case TimelineEventType.EDIT:
        //     case TimelineEventType.USED:
        const result = await service.create(payload);
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
        const emp_id = request?.user?.emp_id;

        emp_authentication(module_name, emp_id, reply);

        const fields: string = request.reply_fields || `*`;
        const conditions: Condition = { sql: ``, params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.timeline_msp_id) {
            conditions.params.push(request.timeline_msp_id);
            conditions.sql += ` AND tlmsp_id = $${conditions.params.length} `;
        }
        if (request.msp_id) {
            conditions.params.push(sanitize_string(request.msp_id));
            conditions.sql += ` AND tlmsp_msp_id = $${conditions.params.length} `;
        }
        if (request.ord_id) {
            conditions.params.push(sanitize_string(request.ord_id));
            conditions.sql += ` AND tlmsp_ord_id = $${conditions.params.length} `;
        }
        if (request.odd_id) {
            conditions.params.push(sanitize_string(request.odd_id));
            conditions.sql += ` AND tlmsp_odd_id = $${conditions.params.length} `;
        }
        if (request.sr_id) {
            conditions.params.push(sanitize_string(request.sr_id));
            conditions.sql += ` AND tlmsp_sr_id = $${conditions.params.length} `;
        }
        if (request.event_type && is_enum_key(event_type_enum, request.event_type)) {
            conditions.params.push(TimelineEventType[request.event_type as keyof typeof TimelineEventType]);
            conditions.sql += ` AND tlmsp_event_type = $${conditions.params.length} `;
        } else if (request.event_type) {
            console.error(`[Controller] Invalid event_type provided in request:`, request.event_type);
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        }
        if (request.status_before && is_enum_key(stock_status_enum, request.status_before)) {
            conditions.params.push(StockStatus[request.status_before as keyof typeof StockStatus]);
            conditions.sql += ` AND tlmsp_status_before = $${conditions.params.length} `;
        } else if (request.status_before) {
            console.error(`[Controller] Invalid status_before provided in request:`, request.status_before);
            invalid_fields.push({
                field: ErrorField.STATUS_BEFORE,
                message: ErrorMessage.STATUS_BEFORE_INVALID
            });
        }
        if (request.status_after && is_enum_key(stock_status_enum, request.status_after)) {
            conditions.params.push(StockStatus[request.status_after as keyof typeof StockStatus]);
            conditions.sql += ` AND tlmsp_status_after = $${conditions.params.length} `;
        } else if (request.status_after) {
            console.error(`[Controller] Invalid status_after provided in request:`, request.status_after);
            invalid_fields.push({
                field: ErrorField.STATUS_AFTER,
                message: ErrorMessage.STATUS_AFTER_INVALID
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

const controller = {
    create,
    get
};

export default controller;
