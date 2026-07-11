import { reply_options } from './model';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';
import service from "./service";
import {
    ErrorField,
    ErrorMessage,
    Payload,
    StockStatus,
    TimelineEventType,
    ValidationError,
} from "./type";

import { get_enum_keys, is_enum_key } from "@/api/utils/enum_checker";
import { sanitize_payload, sanitize_string } from "@/api/utils/input_sanitizer";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
} from "@/api/utils/shared_types";

const event_type_enum = get_enum_keys(TimelineEventType);
const stock_status_enum = get_enum_keys(StockStatus);

const module_name = "TimelineWsrb";

interface TimelineWsrbParams {
    timeline_wsrb_id?: string;
}

interface TimelineWsrbQuery {
    wsrb_id?: string;
    ord_id?: string;
    odd_id?: string;
    sr_id?: string;
    event_type?: string;
    status_before?: string;
    status_after?: string;
}

type TimelineWsrbRequestWithReplyFields = FastifyRequest & {
    reply_fields?: string;
};

interface TimelineWsrbRow {
    tlwsrb_id: string;
    tlwsrb_wsrb_id: string;
    tlwsrb_wsrb_code: string | null;
    tlwsrb_ord_id: string | null;
    tlwsrb_ord_no: string | null;
    tlwsrb_odd_id: string | null;
    tlwsrb_odd_status: string | null;
    tlwsrb_sr_id: string | null;
    tlwsrb_sr_status: string | null;
    tlwsrb_event_type: TimelineEventType;
    tlwsrb_quantity_change: number | null;
    tlwsrb_length_before: number | null;
    tlwsrb_length_after: number | null;
    tlwsrb_status_before: StockStatus | null;
    tlwsrb_status_after: StockStatus | null;
    tlwsrb_location_before: string | null;
    tlwsrb_location_after: string | null;
    tlwsrb_event_at: Date;
    tlwsrb_remark: string | null;
    tlwsrb_created_at: Date;
    tlwsrb_updated_at: Date | null;
}

function has_value(value: unknown): boolean {
    return value !== undefined && value !== null && value !== "";
}

function enum_key(value: string): string {
    return value.trim().replace(/\s+/g, "_").toUpperCase();
}

function is_number_like(value: unknown): boolean {
    if (typeof value === "number") {
        return Number.isFinite(value);
    }
    if (typeof value === "string" && value.trim() !== "") {
        return Number.isFinite(Number(value));
    }
    return false;
}

function is_integer_like(value: unknown): boolean {
    return is_number_like(value) && Number.isInteger(Number(value));
}

function is_valid_date(value: unknown): boolean {
    return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function push_id_length_error(
    invalid_fields: ValidationError[],
    value: string | null | undefined,
    field: ErrorField,
    message: ErrorMessage
) {
    if (value && value.length > 20) {
        invalid_fields.push({ field, message });
    }
}

function timeline_wsrb_from_row(row: TimelineWsrbRow): TimelineWsrb {
    return new TimelineWsrb(
        row.tlwsrb_id,
        new WastrelSteelRoundBar(row.tlwsrb_wsrb_id, row.tlwsrb_wsrb_code),
        row.tlwsrb_ord_id ? new Order(row.tlwsrb_ord_id, row.tlwsrb_ord_no) : null,
        row.tlwsrb_odd_id ? new OrderDetail(row.tlwsrb_odd_id, row.tlwsrb_odd_status) : null,
        row.tlwsrb_sr_id ? new StockReservation(row.tlwsrb_sr_id, row.tlwsrb_sr_status) : null,
        row.tlwsrb_event_type,
        row.tlwsrb_quantity_change,
        row.tlwsrb_length_before,
        row.tlwsrb_length_after,
        row.tlwsrb_status_before,
        row.tlwsrb_status_after,
        row.tlwsrb_location_before,
        row.tlwsrb_location_after,
        row.tlwsrb_event_at,
        row.tlwsrb_remark,
        row.tlwsrb_created_at,
        row.tlwsrb_updated_at
    );
}

function validate_payload(payload: Payload): ValidationError[] {
    const invalid_fields: ValidationError[] = [];

    if (!payload.wsrb_id) {
        invalid_fields.push({
            field: ErrorField.WSRB_ID,
            message: ErrorMessage.WSRB_ID_REQUIRED
        });
    }
    if (!payload.event_type) {
        invalid_fields.push({
            field: ErrorField.EVENT_TYPE,
            message: ErrorMessage.EVENT_TYPE_REQUIRED
        });
    }

    push_id_length_error(invalid_fields, payload.wsrb_id, ErrorField.WSRB_ID, ErrorMessage.WSRB_ID_MAX_LENGTH);
    push_id_length_error(invalid_fields, payload.ord_id, ErrorField.ORD_ID, ErrorMessage.ORD_ID_MAX_LENGTH);
    push_id_length_error(invalid_fields, payload.odd_id, ErrorField.ODD_ID, ErrorMessage.ODD_ID_MAX_LENGTH);
    push_id_length_error(invalid_fields, payload.sr_id, ErrorField.SR_ID, ErrorMessage.SR_ID_MAX_LENGTH);

    if (payload.event_type && !is_enum_key(event_type_enum, payload.event_type)) {
        invalid_fields.push({
            field: ErrorField.EVENT_TYPE,
            message: ErrorMessage.EVENT_TYPE_INVALID
        });
    } else if (payload.event_type) {
        payload.event_type = TimelineEventType[enum_key(payload.event_type) as keyof typeof TimelineEventType];
    }

    if (has_value(payload.quantity_change) && !is_integer_like(payload.quantity_change)) {
        invalid_fields.push({
            field: ErrorField.QUANTITY_CHANGE,
            message: ErrorMessage.QUANTITY_CHANGE_INVALID
        });
    }
    if (has_value(payload.length_before) && !is_number_like(payload.length_before)) {
        invalid_fields.push({
            field: ErrorField.LENGTH_BEFORE,
            message: ErrorMessage.LENGTH_BEFORE_INVALID
        });
    }
    if (has_value(payload.length_after) && !is_number_like(payload.length_after)) {
        invalid_fields.push({
            field: ErrorField.LENGTH_AFTER,
            message: ErrorMessage.LENGTH_AFTER_INVALID
        });
    }

    if (payload.status_before && !is_enum_key(stock_status_enum, payload.status_before)) {
        invalid_fields.push({
            field: ErrorField.STATUS_BEFORE,
            message: ErrorMessage.STATUS_BEFORE_INVALID
        });
    } else if (payload.status_before) {
        payload.status_before = StockStatus[enum_key(payload.status_before) as keyof typeof StockStatus];
    }
    if (payload.status_after && !is_enum_key(stock_status_enum, payload.status_after)) {
        invalid_fields.push({
            field: ErrorField.STATUS_AFTER,
            message: ErrorMessage.STATUS_AFTER_INVALID
        });
    } else if (payload.status_after) {
        payload.status_after = StockStatus[enum_key(payload.status_after) as keyof typeof StockStatus];
    }

    if (payload.event_at && !is_valid_date(payload.event_at)) {
        invalid_fields.push({
            field: ErrorField.EVENT_AT,
            message: ErrorMessage.EVENT_AT_INVALID
        });
    }

    return invalid_fields;
}

async function create(request: FastifyRequest, reply: FastifyReply) {
    try {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const payload = sanitize_payload(body) as Payload;
        console.log("[Controller] Creating timeline WSRB with payload:", payload);

        const invalid_fields = validate_payload(payload);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in timeline WSRB creation payload:", invalid_fields);
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

        const result = await service.create(payload);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = result.data![0] as TimelineWsrbRow;
                console.log("[Controller] Timeline WSRB created successfully with ID:", data.tlwsrb_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.CREATED),
                        timeline_wsrb: timeline_wsrb_from_row(data)
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
                console.error("[Controller] An unrecognized status code was returned from creating timeline WSRB:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating timeline WSRB:", error);
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

async function get(request: TimelineWsrbRequestWithReplyFields, reply: FastifyReply) {
    try {
        const params = request.params as TimelineWsrbParams;
        const query = request.query as TimelineWsrbQuery;
        const fields: string = request.reply_fields || "*";
        const conditions: Condition = { sql: "", params: [] };
        const invalid_fields: ValidationError[] = [];

        if (params.timeline_wsrb_id) {
            const timeline_wsrb_id = sanitize_string(params.timeline_wsrb_id);
            if (timeline_wsrb_id.length > 20) {
                invalid_fields.push({
                    field: ErrorField.ID,
                    message: ErrorMessage.ID_MAX_LENGTH
                });
            }
            conditions.params.push(timeline_wsrb_id);
            conditions.sql += ` AND tlwsrb_id = $${conditions.params.length} `;
        }
        if (query.wsrb_id) {
            conditions.params.push(sanitize_string(query.wsrb_id));
            conditions.sql += ` AND tlwsrb_wsrb_id = $${conditions.params.length} `;
        }
        if (query.ord_id) {
            conditions.params.push(sanitize_string(query.ord_id));
            conditions.sql += ` AND tlwsrb_ord_id = $${conditions.params.length} `;
        }
        if (query.odd_id) {
            conditions.params.push(sanitize_string(query.odd_id));
            conditions.sql += ` AND tlwsrb_odd_id = $${conditions.params.length} `;
        }
        if (query.sr_id) {
            conditions.params.push(sanitize_string(query.sr_id));
            conditions.sql += ` AND tlwsrb_sr_id = $${conditions.params.length} `;
        }
        if (query.event_type && is_enum_key(event_type_enum, query.event_type)) {
            conditions.params.push(TimelineEventType[enum_key(query.event_type) as keyof typeof TimelineEventType]);
            conditions.sql += ` AND tlwsrb_event_type = $${conditions.params.length} `;
        } else if (query.event_type) {
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        }
        if (query.status_before && is_enum_key(stock_status_enum, query.status_before)) {
            conditions.params.push(StockStatus[enum_key(query.status_before) as keyof typeof StockStatus]);
            conditions.sql += ` AND tlwsrb_status_before = $${conditions.params.length} `;
        } else if (query.status_before) {
            invalid_fields.push({
                field: ErrorField.STATUS_BEFORE,
                message: ErrorMessage.STATUS_BEFORE_INVALID
            });
        }
        if (query.status_after && is_enum_key(stock_status_enum, query.status_after)) {
            conditions.params.push(StockStatus[enum_key(query.status_after) as keyof typeof StockStatus]);
            conditions.sql += ` AND tlwsrb_status_after = $${conditions.params.length} `;
        } else if (query.status_after) {
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
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} timeline WSRBs.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        wsrb_id: query.wsrb_id,
                        ord_id: query.ord_id,
                        odd_id: query.odd_id,
                        sr_id: query.sr_id,
                        event_type: query.event_type,
                        status_before: query.status_before,
                        status_after: query.status_after,
                        timeline_wsrbs: results.data?.map(row => timeline_wsrb_from_row(row as TimelineWsrbRow))
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
                console.error("[Controller] An unrecognized status code was returned from getting timeline WSRBs:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting timeline WSRBs:", error);
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

const controller = {
    create,
    get
};

export default controller;
