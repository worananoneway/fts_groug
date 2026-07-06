import {
    ReservationOrder,
    ReservationOrderDetail,
    ReservationStock,
    StockReservation
} from "./model";
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
const module_name = "StockReservation";

interface StockReservationParams {
    sr_id?: string;
    version?: string;
}

interface StockReservationQuery {
    ord_id?: string;
    odd_id?: string;
    stock_id?: string;
    stock_type?: string;
    status?: string;
}

interface StockReservationRequestMetadata {
    reply_fields?: string;
}

interface StockReservationRow {
    sr_id: string;
    sr_ord_id: string;
    sr_ord_no: string | null;
    sr_odd_id: string;
    sr_odd_shape_type: string | null;
    sr_odd_required_length_mm: number | null;
    sr_odd_required_width_mm: number | null;
    sr_odd_required_thickness_mm: number | null;
    sr_odd_required_diameter_mm: number | null;
    sr_odd_quantity: number | null;
    sr_stock_type: ReservationStockType;
    sr_stock_id: string;
    sr_stock_code: string | null;
    sr_stock_status: string | null;
    sr_reserved_quantity: number;
    sr_reserved_length_mm: number | null;
    sr_reserved_width_mm: number | null;
    sr_status: ReservationStatus;
    sr_reserved_at: Date;
    sr_used_at: Date | null;
    sr_created_at: Date;
    sr_updated_at: Date | null;
}

function enum_key(value: string): string {
    return value.trim().replace(/\s+/g, "_").toUpperCase();
}

function is_positive_integer(value: unknown): boolean {
    if (typeof value === "number") {
        return Number.isInteger(value) && value > 0;
    }
    if (typeof value === "string") {
        return /^\d+$/.test(value) && Number(value) > 0;
    }
    return false;
}

function is_positive_number(value: unknown): boolean {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0;
}

function add_id_length_errors(payload: Payload, invalid_fields: ValidationError[]): void {
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
    if (payload.stock_id && payload.stock_id.length > 20) {
        invalid_fields.push({
            field: ErrorField.STOCK_ID,
            message: ErrorMessage.STOCK_ID_MAX_LENGTH
        });
    }
}

function map_stock_reservation(stock_reservation: StockReservationRow): StockReservation {
    return new StockReservation(
        stock_reservation.sr_id,
        stock_reservation.sr_ord_id,
        stock_reservation.sr_odd_id,
        stock_reservation.sr_stock_type,
        stock_reservation.sr_stock_id,
        stock_reservation.sr_reserved_quantity,
        stock_reservation.sr_reserved_length_mm,
        stock_reservation.sr_reserved_width_mm,
        stock_reservation.sr_status,
        stock_reservation.sr_reserved_at,
        stock_reservation.sr_used_at,
        stock_reservation.sr_created_at,
        stock_reservation.sr_updated_at,
        new ReservationOrder(
            stock_reservation.sr_ord_id,
            stock_reservation.sr_ord_no
        ),
        new ReservationOrderDetail(
            stock_reservation.sr_odd_id,
            stock_reservation.sr_odd_shape_type,
            stock_reservation.sr_odd_required_length_mm,
            stock_reservation.sr_odd_required_width_mm,
            stock_reservation.sr_odd_required_thickness_mm,
            stock_reservation.sr_odd_required_diameter_mm,
            stock_reservation.sr_odd_quantity
        ),
        new ReservationStock(
            stock_reservation.sr_stock_id,
            stock_reservation.sr_stock_type,
            stock_reservation.sr_stock_code,
            stock_reservation.sr_stock_status
        )
    );
}

function get_params(request: FastifyRequest): StockReservationParams {
    return request.params as StockReservationParams;
}

function get_query(request: FastifyRequest): StockReservationQuery {
    return request.query as StockReservationQuery;
}

function get_reply_fields(request: FastifyRequest): string {
    return (request as FastifyRequest & StockReservationRequestMetadata).reply_fields || "*";
}

async function create(request: FastifyRequest, reply: FastifyReply) {
    try {
        const payload: Payload = sanitize_payload((request.body ?? {}) as Record<string, unknown>);
        console.log("[Controller] Creating stock reservation with payload:", payload);

        const invalid_fields: ValidationError[] = [];
        if (!payload.ord_id) {
            invalid_fields.push({
                field: ErrorField.ORD_ID,
                message: ErrorMessage.ORD_ID_REQUIRED
            });
        }
        if (!payload.odd_id) {
            invalid_fields.push({
                field: ErrorField.ODD_ID,
                message: ErrorMessage.ODD_ID_REQUIRED
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

        add_id_length_errors(payload, invalid_fields);

        if (payload.stock_type && !is_enum_key(stock_type_enum, payload.stock_type)) {
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        } else if (payload.stock_type) {
            payload.stock_type = ReservationStockType[enum_key(payload.stock_type) as keyof typeof ReservationStockType];
        }

        if (payload.status && !is_enum_key(reservation_status_enum, payload.status)) {
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            });
        } else if (payload.status) {
            payload.status = ReservationStatus[enum_key(payload.status) as keyof typeof ReservationStatus];
        }

        if (payload.reserved_quantity !== undefined && !is_positive_integer(payload.reserved_quantity)) {
            invalid_fields.push({
                field: ErrorField.RESERVED_QUANTITY,
                message: ErrorMessage.RESERVED_QUANTITY_INVALID
            });
        } else if (payload.reserved_quantity !== undefined) {
            payload.reserved_quantity = Number(payload.reserved_quantity);
        }

        if (payload.reserved_length_mm !== undefined && payload.reserved_length_mm !== null) {
            if (!is_positive_number(payload.reserved_length_mm)) {
                invalid_fields.push({
                    field: ErrorField.RESERVED_LENGTH_MM,
                    message: ErrorMessage.RESERVED_LENGTH_MM_INVALID
                });
            } else {
                payload.reserved_length_mm = Number(payload.reserved_length_mm);
            }
        }

        if (payload.reserved_width_mm !== undefined && payload.reserved_width_mm !== null) {
            if (!is_positive_number(payload.reserved_width_mm)) {
                invalid_fields.push({
                    field: ErrorField.RESERVED_WIDTH_MM,
                    message: ErrorMessage.RESERVED_WIDTH_MM_INVALID
                });
            } else {
                payload.reserved_width_mm = Number(payload.reserved_width_mm);
            }
        }

        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in stock reservation creation payload:", invalid_fields);
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
                const data = result.data![0];
                console.log("[Controller] Stock reservation created successfully with ID:", data.sr_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.CREATED),
                        id: data.sr_id,
                        ord_id: data.sr_ord_id,
                        odd_id: data.sr_odd_id,
                        stock_type: data.sr_stock_type,
                        stock_id: data.sr_stock_id,
                        reserved_quantity: data.sr_reserved_quantity,
                        reserved_length_mm: data.sr_reserved_length_mm,
                        reserved_width_mm: data.sr_reserved_width_mm,
                        status: data.sr_status,
                        reserved_at: data.sr_reserved_at,
                        used_at: data.sr_used_at,
                        created_at: data.sr_created_at,
                        updated_at: data.sr_updated_at
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
                console.error("[Controller] An unrecognized status code was returned from creating stock reservation:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating stock reservation:", error);
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

async function get(request: FastifyRequest, reply: FastifyReply) {
    try {
        const fields = get_reply_fields(request);
        const params = get_params(request);
        const query = get_query(request);
        const conditions: Condition = { sql: "", params: [] };
        const invalid_fields: ValidationError[] = [];

        if (params.sr_id) {
            conditions.params.push(sanitize_string(params.sr_id));
            conditions.sql += ` AND sr.sr_id = $${conditions.params.length} `;
        }
        if (query.ord_id) {
            conditions.params.push(sanitize_string(query.ord_id));
            conditions.sql += ` AND sr.sr_ord_id = $${conditions.params.length} `;
        }
        if (query.odd_id) {
            conditions.params.push(sanitize_string(query.odd_id));
            conditions.sql += ` AND sr.sr_odd_id = $${conditions.params.length} `;
        }
        if (query.stock_id) {
            conditions.params.push(sanitize_string(query.stock_id));
            conditions.sql += ` AND sr.sr_stock_id = $${conditions.params.length} `;
        }
        if (query.stock_type && is_enum_key(stock_type_enum, query.stock_type)) {
            conditions.params.push(ReservationStockType[enum_key(query.stock_type) as keyof typeof ReservationStockType]);
            conditions.sql += ` AND sr.sr_stock_type = $${conditions.params.length} `;
        } else if (query.stock_type) {
            console.error("[Controller] Invalid stock_type enum value provided for stock reservation:", query.stock_type);
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        }
        if (query.status && is_enum_key(reservation_status_enum, query.status)) {
            conditions.params.push(ReservationStatus[enum_key(query.status) as keyof typeof ReservationStatus]);
            conditions.sql += ` AND sr.sr_status = $${conditions.params.length} `;
        } else if (query.status) {
            console.error("[Controller] Invalid status enum value provided for stock reservation:", query.status);
            invalid_fields.push({
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
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
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} stock reservations.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        stock_type: query.stock_type,
                        status: query.status,
                        stock_reservations: results.data?.map(map_stock_reservation)
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
                console.error("[Controller] An unrecognized status code was returned from getting stock reservations:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting stock reservations:", error);
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

async function soft_delete(request: FastifyRequest, reply: FastifyReply) {
    try {
        const params = get_params(request);
        if (!params.sr_id) {
            console.error("[Controller] Missing stock reservation ID for deletion.");
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>{
                status: HttpStatus.BAD_REQUEST,
                statuscode: HttpStatusCode.BAD_REQUEST,
                details: {
                    error: ReplyErrorField.VALIDATION_ERROR,
                    message: ReplyErrorMessage.VALIDATION_ERROR,
                    errors: [{
                        field: ErrorField.ID,
                        message: ErrorMessage.ID_REQUIRED
                    }]
                }
            });
        }

        const sr_id = sanitize_string(params.sr_id);
        const stock_reservation_data = await service.get({ sql: " AND sr.sr_id = $1", params: [sr_id] });
        if (stock_reservation_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
                status: HttpStatus.NOT_FOUND,
                statuscode: HttpStatusCode.NOT_FOUND,
                details: {
                    error: ReplyErrorField.NOT_FOUND,
                    message: ReplyErrorMessage.NOT_FOUND
                }
            });
        } else if (stock_reservation_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                details: {
                    error: ReplyErrorField.INTERNAL_SERVER_ERROR,
                    message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
                }
            });
        }

        const current_data = stock_reservation_data.data![0];
        if (current_data.sr_status === ReservationStatus.INACTIVE) {
            console.error(`[Controller] Stock reservation with ID ${sr_id} is already inactive.`);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ErrorField.STATUS,
                    message: ErrorMessage.STATUS_CONFLICT
                }
            });
        }

        const result = await service.soft_delete(sr_id);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Stock reservation with ID ${sr_id} successfully deleted.`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.DELETED)
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
                console.error("[Controller] An unrecognized status code was returned from deleting stock reservation:", result.statuscode);
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
        console.error("[Controller] An error occurred during deleting stock reservation:", error);
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
    get,
    soft_delete
};

export default controller;
