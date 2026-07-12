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
            'msp_id',
            'po_id',
            'podetail_id',
            'sr_id',
            'event_type',
            'quantity_change',
            'length_before',
            'width_before',
            'length_after',
            'width_after',
            'status_before',
            'status_after',
            'location_before',
            'location_after',
            'event_at',
            'remark'
        ];
        const missing_fields: string[] = field_validator(request.body, requiredKeys);
        if (missing_fields.length > 0) {
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, missing_fields)
            );
        }

        const invalid_fields: ValidationError[] = [];
        if (!payload.msp_id) {
            invalid_fields.push({
                field: ErrorField.MSP_ID,
                message: ErrorMessage.MSP_ID_REQUIRED
            });
        }
        if (payload.msp_id && payload.msp_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.MSP_ID,
                message: ErrorMessage.MSP_ID_MAX_LENGTH
            });
        }
        if (payload.po_id && payload.po_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.po_id,
                message: ErrorMessage.po_id_MAX_LENGTH
            });
        }
        if (payload.podetail_id && payload.podetail_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.podetail_id,
                message: ErrorMessage.podetail_id_MAX_LENGTH
            });
        }
        if (payload.sr_id && payload.sr_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.SR_ID,
                message: ErrorMessage.SR_ID_MAX_LENGTH
            });
        }
        if (!payload.event_type) {
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_REQUIRED
            });
        }
        else if (!is_enum_key(event_type_enum, request.body.event_type)) {
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
        const result = await service.create(payload);
        if (result.statuscode !== HttpStatusCode.CREATED) {
            console.error(`[Controller] Failed to create ${module_name}:`, result.error);
            return reply.code(result.statuscode).send(<Reply>
                reply_result(module_name, result.statuscode)
            );
        }
        const msps = await service.get_msps(payload.msp_id);
        if (msps.statuscode !== HttpStatusCode.OK) {
            console.error(`[Controller] Failed to get MSP:`, msps.error);
            return reply.code(msps.statuscode).send(<Reply>
                reply_result(module_name, msps.statuscode)
            );
        }
        const msps_data = msps?.data;
        const update_msps = {
            total_quantity: msps_data?.msp_quantity,
            total_available_quantity: msps_data?.msp_available_quantity
        };
        switch (payload.event_type) {
            case TimelineEventType.ADD:
                update_msps.total_quantity = msps_data?.msp_quantity + payload.quantity_change;
                update_msps.total_available_quantity = msps_data?.msp_available_quantity + payload.quantity_change;
                break;
            case TimelineEventType.USED:
                update_msps.total_quantity = msps_data?.msp_quantity - payload.quantity_change;
                update_msps.total_available_quantity = msps_data?.msp_available_quantity - payload.quantity_change;
                break;
            case TimelineEventType.EDIT:
                update_msps.total_quantity = msps_data?.msp_quantity + (msps_data?.msp_quantity - payload.quantity_change);
                update_msps.total_available_quantity = msps_data?.msp_available_quantity + (msps_data?.msp_quantity - payload.quantity_change);
                break;
        }
        const update_msps_result = await service.update_msps(payload.msp_id, update_msps);
        if (update_msps_result.statuscode !== HttpStatusCode.OK) {
            console.error(`[Controller] Failed to update MSP:`, update_msps_result.error);
            return reply.code(update_msps_result.statuscode).send(<Reply>
                reply_result(module_name, update_msps_result.statuscode)
            );
        }
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
        if (request.po_id) {
            conditions.params.push(sanitize_string(request.po_id));
            conditions.sql += ` AND tlmsp_po_id = $${conditions.params.length} `;
        }
        if (request.podetail_id) {
            conditions.params.push(sanitize_string(request.podetail_id));
            conditions.sql += ` AND tlmsp_podetail_id = $${conditions.params.length} `;
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
