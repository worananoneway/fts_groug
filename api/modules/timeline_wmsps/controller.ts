import { TimelineWmsp } from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    StockStatus,
    TimelineEventType,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload } from '@/api/utils/input_sanitizer';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
} from '@/api/utils/shared_types';

const event_type_enum = get_enum_keys(TimelineEventType);
const stock_status_enum = get_enum_keys(StockStatus);

const module_name = 'TimelineWmsp';

async function create(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        // const user = request.user;
        // if (!user || !user.id) {
        //     console.error("[Controller] Missing user ID from authenticated request.");
        //     return reply.code(HttpStatusCode.UNAUTHORIZED).send(<Reply>{
        //         status: HttpStatus.UNAUTHORIZED,
        //         statuscode: HttpStatusCode.UNAUTHORIZED,
        //         details: {
        //             error: ReplyErrorField.UNAUTHORIZED,
        //             message: ReplyErrorMessage.UNAUTHORIZED
        //         }
        //     });
        // }
        // const emp_id: string = user?.id;
        const emp_id = null;
        const payload: Payload = sanitize_payload(request.body);
        console.log("[Controller] Creating timeline wastrel MS plate with payload:", payload);
        const invalid_fields: ValidationError[] = [];
        if (!payload.wmsp_id) {
            invalid_fields.push({
                field: ErrorField.WMSP_ID,
                message: ErrorMessage.WMSP_ID_REQUIRED
            });
        }
        if (payload.wmsp_id && payload.wmsp_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.WMSP_ID,
                message: ErrorMessage.WMSP_ID_MAX_LENGTH
            });
        }
        if (payload.ord_id && payload.ord_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.ORD_ID,
                message: ErrorMessage.ORD_ID_MAX_LENGTH
            });
        }
        if (payload.odd_id && payload.odd_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.ODD_ID,
                message: ErrorMessage.ODD_ID_MAX_LENGTH
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
        } else if (!is_enum_key(event_type_enum, payload.event_type)) {
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        } else {
            payload.event_type = TimelineEventType[payload.event_type.toUpperCase() as keyof typeof TimelineEventType];
        }
        if (payload.quantity_change !== undefined && payload.quantity_change !== null && !Number.isInteger(Number(payload.quantity_change))) {
            invalid_fields.push({
                field: ErrorField.QUANTITY_CHANGE,
                message: ErrorMessage.QUANTITY_CHANGE_INVALID
            });
        }
        if (payload.length_before !== undefined && payload.length_before !== null && (isNaN(Number(payload.length_before)) || Number(payload.length_before) < 0)) {
            invalid_fields.push({
                field: ErrorField.LENGTH_BEFORE,
                message: ErrorMessage.LENGTH_BEFORE_INVALID
            });
        }
        if (payload.width_before !== undefined && payload.width_before !== null && (isNaN(Number(payload.width_before)) || Number(payload.width_before) < 0)) {
            invalid_fields.push({
                field: ErrorField.WIDTH_BEFORE,
                message: ErrorMessage.WIDTH_BEFORE_INVALID
            });
        }
        if (payload.length_after !== undefined && payload.length_after !== null && (isNaN(Number(payload.length_after)) || Number(payload.length_after) < 0)) {
            invalid_fields.push({
                field: ErrorField.LENGTH_AFTER,
                message: ErrorMessage.LENGTH_AFTER_INVALID
            });
        }
        if (payload.width_after !== undefined && payload.width_after !== null && (isNaN(Number(payload.width_after)) || Number(payload.width_after) < 0)) {
            invalid_fields.push({
                field: ErrorField.WIDTH_AFTER,
                message: ErrorMessage.WIDTH_AFTER_INVALID
            });
        }
        if (payload.status_before && !is_enum_key(stock_status_enum, payload.status_before)) {
            invalid_fields.push({
                field: ErrorField.STATUS_BEFORE,
                message: ErrorMessage.STATUS_BEFORE_INVALID
            });
        } else if (payload.status_before) {
            payload.status_before = StockStatus[payload.status_before.toUpperCase() as keyof typeof StockStatus];
        }
        if (payload.status_after && !is_enum_key(stock_status_enum, payload.status_after)) {
            invalid_fields.push({
                field: ErrorField.STATUS_AFTER,
                message: ErrorMessage.STATUS_AFTER_INVALID
            });
        } else if (payload.status_after) {
            payload.status_after = StockStatus[payload.status_after.toUpperCase() as keyof typeof StockStatus];
        }
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in timeline wastrel MS plate creation payload:", invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }
        const result = await service.create(payload, emp_id);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0];
                console.log("[Controller] Timeline wastrel MS plate created successfully with ID:", data.tlwmsp_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.CREATED),
                        id: data.tlwmsp_id,
                        wmsp_id: data.tlwmsp_wmsp_id,
                        ord_id: data.tlwmsp_ord_id,
                        odd_id: data.tlwmsp_odd_id,
                        sr_id: data.tlwmsp_sr_id,
                        event_type: data.tlwmsp_event_type,
                        quantity_change: data.tlwmsp_quantity_change,
                        length_before: data.tlwmsp_length_before,
                        width_before: data.tlwmsp_width_before,
                        length_after: data.tlwmsp_length_after,
                        width_after: data.tlwmsp_width_after,
                        status_before: data.tlwmsp_status_before,
                        status_after: data.tlwmsp_status_after,
                        location_before: data.tlwmsp_location_before,
                        location_after: data.tlwmsp_location_after,
                        event_at: data.tlwmsp_event_at,
                        remark: data.tlwmsp_remark,
                        created_at: data.tlwmsp_created_at,
                        updated_at: data.tlwmsp_updated_at,
                        emp_id: data.tlwmsp_emp_id
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            default:
                console.error("[Controller] An unrecognized status code was returned from creating timeline wastrel MS plate:", result.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during creating timeline wastrel MS plate:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
async function get(request: any, reply: any) {
    try {
        const lang = request.headers['accept-language'] || 'en-US';
        const fields: string = request.reply_fields;
        const conditions: Condition = { sql: '', params: [] };

        const invalid_fields: ValidationError[] = [];
        if (request.params.tlwmsp_id) {
            conditions.params.push(request.params.tlwmsp_id);
            conditions.sql += ` AND tlwmsp_id = $${conditions.params.length} `;
        }
        if (request.query.wmsp_id) {
            conditions.params.push(request.query.wmsp_id);
            conditions.sql += ` AND tlwmsp_wmsp_id = $${conditions.params.length} `;
        }
        if (request.query.ord_id) {
            conditions.params.push(request.query.ord_id);
            conditions.sql += ` AND tlwmsp_ord_id = $${conditions.params.length} `;
        }
        if (request.query.odd_id) {
            conditions.params.push(request.query.odd_id);
            conditions.sql += ` AND tlwmsp_odd_id = $${conditions.params.length} `;
        }
        if (request.query.sr_id) {
            conditions.params.push(request.query.sr_id);
            conditions.sql += ` AND tlwmsp_sr_id = $${conditions.params.length} `;
        }
        if (request.query.event_type && is_enum_key(event_type_enum, request.query.event_type)) {
            conditions.params.push(TimelineEventType[request.query.event_type.toUpperCase() as keyof typeof TimelineEventType]);
            conditions.sql += ` AND tlwmsp_event_type = $${conditions.params.length} `;
        } else if (request.query.event_type) {
            console.error("[Controller] Invalid Type enum of event_type value provided for timeline wastrel MS plate: ", request.query.event_type);
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        }
        if (request.query.status_before && is_enum_key(stock_status_enum, request.query.status_before)) {
            conditions.params.push(StockStatus[request.query.status_before.toUpperCase() as keyof typeof StockStatus]);
            conditions.sql += ` AND tlwmsp_status_before = $${conditions.params.length} `;
        } else if (request.query.status_before) {
            console.error("[Controller] Invalid Type enum of status_before value provided for timeline wastrel MS plate: ", request.query.status_before);
            invalid_fields.push({
                field: ErrorField.STATUS_BEFORE,
                message: ErrorMessage.STATUS_BEFORE_INVALID
            });
        }
        if (request.query.status_after && is_enum_key(stock_status_enum, request.query.status_after)) {
            conditions.params.push(StockStatus[request.query.status_after.toUpperCase() as keyof typeof StockStatus]);
            conditions.sql += ` AND tlwmsp_status_after = $${conditions.params.length} `;
        } else if (request.query.status_after) {
            console.error("[Controller] Invalid Type enum of status_after value provided for timeline wastrel MS plate: ", request.query.status_after);
            invalid_fields.push({
                field: ErrorField.STATUS_AFTER,
                message: ErrorMessage.STATUS_AFTER_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>{
                status: HttpStatus.UNPROCESSABLE_CONTENT,
                statuscode: HttpStatusCode.UNPROCESSABLE_CONTENT,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: invalid_fields
                }
            });
        }

        const results = await service.get(conditions, fields);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} timeline wastrel MS plates.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        event_type: request.query.event_type,
                        status_before: request.query.status_before,
                        status_after: request.query.status_after,
                        timeline_wmsps: results.data?.map(timeline_wmsp => new TimelineWmsp(
                            timeline_wmsp.tlwmsp_id,
                            timeline_wmsp.tlwmsp_wmsp_id,
                            timeline_wmsp.tlwmsp_ord_id,
                            timeline_wmsp.tlwmsp_odd_id,
                            timeline_wmsp.tlwmsp_sr_id,
                            timeline_wmsp.tlwmsp_event_type,
                            timeline_wmsp.tlwmsp_quantity_change,
                            timeline_wmsp.tlwmsp_length_before,
                            timeline_wmsp.tlwmsp_width_before,
                            timeline_wmsp.tlwmsp_length_after,
                            timeline_wmsp.tlwmsp_width_after,
                            timeline_wmsp.tlwmsp_status_before,
                            timeline_wmsp.tlwmsp_status_after,
                            timeline_wmsp.tlwmsp_location_before,
                            timeline_wmsp.tlwmsp_location_after,
                            timeline_wmsp.tlwmsp_event_at,
                            timeline_wmsp.tlwmsp_remark,
                            timeline_wmsp.tlwmsp_created_at,
                            timeline_wmsp.tlwmsp_updated_at,
                            timeline_wmsp.tlwmsp_emp_id
                        ))
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                    status: HttpStatus.NOT_FOUND,
                    statuscode: HttpStatusCode.NOT_FOUND,
                    details: {
                        error: ReplyErrorField.NOT_FOUND,
                        message: ReplyErrorMessage.NOT_FOUND
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                        message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                    }
                });
            default:
                console.error("[Controller] An unrecognized status code was returned from getting timeline wastrel MS plates:", results.statuscode);
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    details: {
                        error: ReplyErrorField.UNRECOGNIZED_STATUSCODE,
                        message: ReplyErrorMessage.UNRECOGNIZED_STATUSCODE
                    }
                });
        }
    } catch (error) {
        console.error("[Controller] An error occurred during getting timeline wastrel MS plates:", error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
            details: {
                error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
            }
        });
    }
}
export default {
    create,
    get
};
