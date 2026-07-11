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

const module_name = "TimelineSrb";

interface TimelineSrbParams {
    timeline_srb_id?: string;
}

interface TimelineSrbQuery {
    srb_id?: string;
    ord_id?: string;
    odd_id?: string;
    sr_id?: string;
    event_type?: string;
    status_before?: string;
    status_after?: string;
}

type TimelineSrbRequestWithReplyFields = FastifyRequest & {
    reply_fields?: string;
};

interface TimelineSrbRow {
    tlsrb_id: string;
    tlsrb_srb_id: string;
    tlsrb_srb_code: string | null;
    tlsrb_ord_id: string | null;
    tlsrb_ord_no: string | null;
    tlsrb_odd_id: string | null;
    tlsrb_odd_status: string | null;
    tlsrb_sr_id: string | null;
    tlsrb_sr_status: string | null;
    tlsrb_event_type: TimelineEventType;
    tlsrb_quantity_change: number | null;
    tlsrb_length_before: number | null;
    tlsrb_length_after: number | null;
    tlsrb_status_before: StockStatus | null;
    tlsrb_status_after: StockStatus | null;
    tlsrb_location_before: string | null;
    tlsrb_location_after: string | null;
    tlsrb_event_at: Date;
    tlsrb_remark: string | null;
    tlsrb_created_at: Date;
    tlsrb_updated_at: Date | null;
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

function timeline_srb_from_row(row: TimelineSrbRow): TimelineSrb {
    return new TimelineSrb(
        row.tlsrb_id,
        new SteelRoundBar(row.tlsrb_srb_id, row.tlsrb_srb_code),
        row.tlsrb_ord_id ? new Order(row.tlsrb_ord_id, row.tlsrb_ord_no) : null,
        row.tlsrb_odd_id ? new OrderDetail(row.tlsrb_odd_id, row.tlsrb_odd_status) : null,
        row.tlsrb_sr_id ? new StockReservation(row.tlsrb_sr_id, row.tlsrb_sr_status) : null,
        row.tlsrb_event_type,
        row.tlsrb_quantity_change,
        row.tlsrb_length_before,
        row.tlsrb_length_after,
        row.tlsrb_status_before,
        row.tlsrb_status_after,
        row.tlsrb_location_before,
        row.tlsrb_location_after,
        row.tlsrb_event_at,
        row.tlsrb_remark,
        row.tlsrb_created_at,
        row.tlsrb_updated_at
    );
}

function validate_payload(payload: Payload): ValidationError[] {
    const invalid_fields: ValidationError[] = [];

    if (!payload.srb_id) {
        invalid_fields.push({
            field: ErrorField.SRB_ID,
            message: ErrorMessage.SRB_ID_REQUIRED
        });
    }
    if (!payload.event_type) {
        invalid_fields.push({
            field: ErrorField.EVENT_TYPE,
            message: ErrorMessage.EVENT_TYPE_REQUIRED
        });
    }

    push_id_length_error(invalid_fields, payload.srb_id, ErrorField.SRB_ID, ErrorMessage.SRB_ID_MAX_LENGTH);
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
        console.log("[Controller] Creating timeline SRB with payload:", payload);

        const invalid_fields = validate_payload(payload);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in timeline SRB creation payload:", invalid_fields);
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
                const data = result.data![0] as TimelineSrbRow;
                console.log("[Controller] Timeline SRB created successfully with ID:", data.tlsrb_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.CREATED),
                        timeline_srb: timeline_srb_from_row(data)
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
                console.error("[Controller] An unrecognized status code was returned from creating timeline SRB:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating timeline SRB:", error);
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

async function get(request: TimelineSrbRequestWithReplyFields, reply: FastifyReply) {
    try {
        const params = request.params as TimelineSrbParams;
        const query = request.query as TimelineSrbQuery;
        const fields: string = request.reply_fields || "*";
        const conditions: Condition = { sql: "", params: [] };
        const invalid_fields: ValidationError[] = [];

        if (params.timeline_srb_id) {
            const timeline_srb_id = sanitize_string(params.timeline_srb_id);
            if (timeline_srb_id.length > 20) {
                invalid_fields.push({
                    field: ErrorField.ID,
                    message: ErrorMessage.ID_MAX_LENGTH
                });
            }
            conditions.params.push(timeline_srb_id);
            conditions.sql += ` AND tlsrb_id = $${conditions.params.length} `;
        }
        if (query.srb_id) {
            conditions.params.push(sanitize_string(query.srb_id));
            conditions.sql += ` AND tlsrb_srb_id = $${conditions.params.length} `;
        }
        if (query.ord_id) {
            conditions.params.push(sanitize_string(query.ord_id));
            conditions.sql += ` AND tlsrb_ord_id = $${conditions.params.length} `;
        }
        if (query.odd_id) {
            conditions.params.push(sanitize_string(query.odd_id));
            conditions.sql += ` AND tlsrb_odd_id = $${conditions.params.length} `;
        }
        if (query.sr_id) {
            conditions.params.push(sanitize_string(query.sr_id));
            conditions.sql += ` AND tlsrb_sr_id = $${conditions.params.length} `;
        }
        if (query.event_type && is_enum_key(event_type_enum, query.event_type)) {
            conditions.params.push(TimelineEventType[enum_key(query.event_type) as keyof typeof TimelineEventType]);
            conditions.sql += ` AND tlsrb_event_type = $${conditions.params.length} `;
        } else if (query.event_type) {
            invalid_fields.push({
                field: ErrorField.EVENT_TYPE,
                message: ErrorMessage.EVENT_TYPE_INVALID
            });
        }
        if (query.status_before && is_enum_key(stock_status_enum, query.status_before)) {
            conditions.params.push(StockStatus[enum_key(query.status_before) as keyof typeof StockStatus]);
            conditions.sql += ` AND tlsrb_status_before = $${conditions.params.length} `;
        } else if (query.status_before) {
            invalid_fields.push({
                field: ErrorField.STATUS_BEFORE,
                message: ErrorMessage.STATUS_BEFORE_INVALID
            });
        }
        if (query.status_after && is_enum_key(stock_status_enum, query.status_after)) {
            conditions.params.push(StockStatus[enum_key(query.status_after) as keyof typeof StockStatus]);
            conditions.sql += ` AND tlsrb_status_after = $${conditions.params.length} `;
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
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} timeline SRBs.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        srb_id: query.srb_id,
                        ord_id: query.ord_id,
                        odd_id: query.odd_id,
                        sr_id: query.sr_id,
                        event_type: query.event_type,
                        status_before: query.status_before,
                        status_after: query.status_after,
                        timeline_srbs: results.data?.map(row => timeline_srb_from_row(row as TimelineSrbRow))
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
                console.error("[Controller] An unrecognized status code was returned from getting timeline SRBs:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting timeline SRBs:", error);
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
