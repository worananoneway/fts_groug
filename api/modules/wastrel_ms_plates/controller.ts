import {
    Location,
    Material,
    Order,
    OrderDetail,
    SourceMSPlate,
    WastrelMSPlate
} from "./model";
import { FastifyReply, FastifyRequest } from "fastify";
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
const module_name = "WastrelMSPlate";

type NumericInput = number | string;

export interface WastrelMSPlateParams {
    wmsp_id?: string;
}

export interface WastrelMSPlateQuery {
    mm_id?: string;
    msp_id?: string;
    loc_id?: string;
    ord_id?: string;
    odd_id?: string;
    stock_code?: string;
    location_type?: string;
    status?: string;
}

export interface WastrelMSPlateBody {
    mm_id?: string;
    wmsp_mm_id?: string;
    msp_id?: string | null;
    wmsp_msp_id?: string | null;
    stock_code?: string;
    wmsp_stock_code?: string;
    length?: NumericInput;
    wmsp_length?: NumericInput;
    width?: NumericInput;
    wmsp_width?: NumericInput;
    thickness?: NumericInput;
    wmsp_thickness?: NumericInput;
    quantity?: NumericInput;
    wmsp_quantity?: NumericInput;
    available_quantity?: NumericInput;
    wmsp_available_quantity?: NumericInput;
    loc_id?: string | null;
    wmsp_loc_id?: string | null;
    location_type?: string | LocationType | null;
    wmsp_location_type?: string | LocationType | null;
    location?: string | null;
    wmsp_location?: string | null;
    ord_id?: string | null;
    wmsp_ord_id?: string | null;
    odd_id?: string | null;
    wmsp_odd_id?: string | null;
    remark?: string | null;
    wmsp_remark?: string | null;
    status?: string;
}

type WastrelMSPlateRequest = FastifyRequest<{
    Params: WastrelMSPlateParams;
    Querystring: WastrelMSPlateQuery;
    Body: WastrelMSPlateBody;
}> & {
    reply_fields?: string;
};

interface DuplicateCountRow {
    duplicate_stock_code: string | number;
}

interface WastrelMSPlateRow {
    wmsp_id: string;
    wmsp_mm_id: string;
    wmsp_mm_code?: string | null;
    wmsp_mm_name?: string | null;
    wmsp_mm_shape_type?: string | null;
    wmsp_mm_grade?: string | null;
    wmsp_msp_id?: string | null;
    wmsp_msp_code?: string | null;
    wmsp_stock_code: string;
    wmsp_length: number;
    wmsp_width: number;
    wmsp_thickness: number;
    wmsp_quantity: number;
    wmsp_available_quantity: number;
    wmsp_loc_id?: string | null;
    wmsp_loc_code?: string | null;
    wmsp_loc_name?: string | null;
    wmsp_loc_type?: string | null;
    wmsp_location_type?: string | null;
    wmsp_location?: string | null;
    wmsp_status: string;
    wmsp_ord_id?: string | null;
    wmsp_ord_no?: string | null;
    wmsp_odd_id?: string | null;
    wmsp_odd_ord_id?: string | null;
    wmsp_remark?: string | null;
    wmsp_created_at: Date;
    wmsp_updated_at?: Date | null;
}

function to_enum_key(value: unknown): string {
    return String(value).trim().replace(/\s+/g, "_").toUpperCase();
}

function has_value(value: unknown): boolean {
    return value !== undefined && value !== null && value !== "";
}

function number_value(value: unknown): number | undefined {
    return has_value(value) ? Number(value) : undefined;
}

function string_value(value: unknown): string | undefined {
    return has_value(value) ? String(value) : undefined;
}

function optional_string_value(value: unknown): string | null | undefined {
    if (!has_value(value)) return value === null ? null : undefined;
    const normalized = String(value);
    return normalized === "" ? null : normalized;
}

function is_positive_number(value: unknown): boolean {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
}

function is_positive_integer(value: unknown): boolean {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function is_non_negative_integer(value: unknown): boolean {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0;
}

function normalize_payload(raw: WastrelMSPlateBody): Payload {
    return {
        mm_id: string_value(raw.mm_id ?? raw.wmsp_mm_id) as string,
        msp_id: optional_string_value(raw.msp_id ?? raw.wmsp_msp_id),
        stock_code: string_value(raw.stock_code ?? raw.wmsp_stock_code) as string,
        length: number_value(raw.length ?? raw.wmsp_length) as number,
        width: number_value(raw.width ?? raw.wmsp_width) as number,
        thickness: number_value(raw.thickness ?? raw.wmsp_thickness) as number,
        quantity: number_value(raw.quantity ?? raw.wmsp_quantity),
        available_quantity: number_value(raw.available_quantity ?? raw.wmsp_available_quantity),
        loc_id: optional_string_value(raw.loc_id ?? raw.wmsp_loc_id),
        location_type: optional_string_value(raw.location_type ?? raw.wmsp_location_type) as LocationType | null | undefined,
        location: optional_string_value(raw.location ?? raw.wmsp_location),
        ord_id: optional_string_value(raw.ord_id ?? raw.wmsp_ord_id),
        odd_id: optional_string_value(raw.odd_id ?? raw.wmsp_odd_id),
        remark: optional_string_value(raw.remark ?? raw.wmsp_remark)
    };
}

function validate_payload(payload: Payload, require_inventory: boolean): ValidationError[] {
    const invalid_fields: ValidationError[] = [];

    if (!has_value(payload.mm_id)) {
        invalid_fields.push({ field: ErrorField.MM_ID, message: ErrorMessage.MM_ID_REQUIRED });
    } else if (payload.mm_id.length > 20) {
        invalid_fields.push({ field: ErrorField.MM_ID, message: ErrorMessage.MM_ID_MAX_LENGTH });
    }

    if (has_value(payload.msp_id) && payload.msp_id!.length > 20) {
        invalid_fields.push({ field: ErrorField.MSP_ID, message: ErrorMessage.MSP_ID_MAX_LENGTH });
    }

    if (!has_value(payload.stock_code)) {
        invalid_fields.push({ field: ErrorField.STOCK_CODE, message: ErrorMessage.STOCK_CODE_REQUIRED });
    } else if (payload.stock_code.length > 50) {
        invalid_fields.push({ field: ErrorField.STOCK_CODE, message: ErrorMessage.STOCK_CODE_MAX_LENGTH });
    }

    if (!has_value(payload.length)) {
        invalid_fields.push({ field: ErrorField.LENGTH, message: ErrorMessage.LENGTH_REQUIRED });
    } else if (!is_positive_number(payload.length)) {
        invalid_fields.push({ field: ErrorField.LENGTH, message: ErrorMessage.LENGTH_INVALID });
    }

    if (!has_value(payload.width)) {
        invalid_fields.push({ field: ErrorField.WIDTH, message: ErrorMessage.WIDTH_REQUIRED });
    } else if (!is_positive_number(payload.width)) {
        invalid_fields.push({ field: ErrorField.WIDTH, message: ErrorMessage.WIDTH_INVALID });
    }

    if (!has_value(payload.thickness)) {
        invalid_fields.push({ field: ErrorField.THICKNESS, message: ErrorMessage.THICKNESS_REQUIRED });
    } else if (!is_positive_number(payload.thickness)) {
        invalid_fields.push({ field: ErrorField.THICKNESS, message: ErrorMessage.THICKNESS_INVALID });
    }

    if (require_inventory && !has_value(payload.quantity)) {
        invalid_fields.push({ field: ErrorField.QUANTITY, message: ErrorMessage.QUANTITY_REQUIRED });
    } else if (has_value(payload.quantity) && !is_positive_integer(payload.quantity)) {
        invalid_fields.push({ field: ErrorField.QUANTITY, message: ErrorMessage.QUANTITY_INVALID });
    }

    if (require_inventory && !has_value(payload.available_quantity)) {
        invalid_fields.push({ field: ErrorField.AVAILABLE_QUANTITY, message: ErrorMessage.AVAILABLE_QUANTITY_REQUIRED });
    } else if (has_value(payload.available_quantity) && !is_non_negative_integer(payload.available_quantity)) {
        invalid_fields.push({ field: ErrorField.AVAILABLE_QUANTITY, message: ErrorMessage.AVAILABLE_QUANTITY_INVALID });
    }

    const quantity = has_value(payload.quantity) ? Number(payload.quantity) : 1;
    const available_quantity = has_value(payload.available_quantity) ? Number(payload.available_quantity) : quantity;
    if (Number.isFinite(quantity) && Number.isFinite(available_quantity) && available_quantity > quantity) {
        invalid_fields.push({ field: ErrorField.AVAILABLE_QUANTITY, message: ErrorMessage.AVAILABLE_QUANTITY_INVALID });
    }

    if (has_value(payload.loc_id) && payload.loc_id!.length > 20) {
        invalid_fields.push({ field: ErrorField.LOC_ID, message: ErrorMessage.LOC_ID_MAX_LENGTH });
    }

    if (has_value(payload.location_type)) {
        if (!is_enum_key(location_type_enum, payload.location_type)) {
            invalid_fields.push({ field: ErrorField.LOCATION_TYPE, message: ErrorMessage.LOCATION_TYPE_INVALID });
        } else {
            payload.location_type = LocationType[to_enum_key(payload.location_type) as keyof typeof LocationType];
        }
    }

    if (has_value(payload.ord_id) && payload.ord_id!.length > 20) {
        invalid_fields.push({ field: ErrorField.ORD_ID, message: ErrorMessage.ORD_ID_MAX_LENGTH });
    }

    if (has_value(payload.odd_id) && payload.odd_id!.length > 20) {
        invalid_fields.push({ field: ErrorField.ODD_ID, message: ErrorMessage.ODD_ID_MAX_LENGTH });
    }

    return invalid_fields;
}

function send_validation_errors(reply: FastifyReply, errors: ValidationError[], statuscode = HttpStatusCode.UNPROCESSABLE_CONTENT) {
    return reply.code(statuscode).send(<Reply>{
        status: statuscode === HttpStatusCode.BAD_REQUEST ? HttpStatus.BAD_REQUEST : HttpStatus.UNPROCESSABLE_CONTENT,
        statuscode,
        details: {
            error: ReplyErrorField.VALIDATION_ERROR,
            message: ReplyErrorMessage.VALIDATION_ERROR,
            errors
        }
    });
}

function send_internal_error(reply: FastifyReply) {
    return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>{
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        statuscode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        details: {
            error: ReplyErrorField.INTERNAL_SERVER_ERROR,
            message: ReplyErrorMessage.INTERNAL_SERVER_ERROR
        }
    });
}

function send_not_found(reply: FastifyReply) {
    return reply.code(HttpStatusCode.NOT_FOUND).send(<Reply>{
        status: HttpStatus.NOT_FOUND,
        statuscode: HttpStatusCode.NOT_FOUND,
        details: {
            error: ReplyErrorField.NOT_FOUND,
            message: ReplyErrorMessage.NOT_FOUND
        }
    });
}

function map_wastrel_ms_plate(wmsp: WastrelMSPlateRow): WastrelMSPlate {
    return new WastrelMSPlate(
        wmsp.wmsp_id,
        new Material(
            wmsp.wmsp_mm_id,
            wmsp.wmsp_mm_code ?? null,
            wmsp.wmsp_mm_name ?? null,
            wmsp.wmsp_mm_shape_type ?? null,
            wmsp.wmsp_mm_grade ?? null
        ),
        wmsp.wmsp_msp_id
            ? new SourceMSPlate(wmsp.wmsp_msp_id, wmsp.wmsp_msp_code ?? null)
            : null,
        wmsp.wmsp_stock_code,
        wmsp.wmsp_length,
        wmsp.wmsp_width,
        wmsp.wmsp_thickness,
        wmsp.wmsp_quantity,
        wmsp.wmsp_available_quantity,
        wmsp.wmsp_loc_id
            ? new Location(wmsp.wmsp_loc_id, wmsp.wmsp_loc_code ?? null, wmsp.wmsp_loc_name ?? null, wmsp.wmsp_loc_type as LocationType | null)
            : null,
        wmsp.wmsp_location_type as LocationType | null,
        wmsp.wmsp_location ?? null,
        wmsp.wmsp_status as StockStatus,
        wmsp.wmsp_ord_id ? new Order(wmsp.wmsp_ord_id, wmsp.wmsp_ord_no ?? null) : null,
        wmsp.wmsp_odd_id ? new OrderDetail(wmsp.wmsp_odd_id, wmsp.wmsp_odd_ord_id ?? null) : null,
        wmsp.wmsp_remark ?? null,
        wmsp.wmsp_created_at,
        wmsp.wmsp_updated_at ?? null
    );
}

async function create(request: WastrelMSPlateRequest, reply: FastifyReply) {
    try {
        const sanitized_body = sanitize_payload(request.body ?? {}) as WastrelMSPlateBody;
        const payload = normalize_payload(sanitized_body);
        console.log("[Controller] Creating wastrel MS plate with payload:", payload);

        const invalid_fields = validate_payload(payload, false);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel MS plate creation payload:", invalid_fields);
            return send_validation_errors(reply, invalid_fields);
        }

        const duplicate_check = await service.count_duplicate({ sql: "", params: [payload.stock_code] });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return send_internal_error(reply);
        }

        const duplicates = (duplicate_check.data as DuplicateCountRow[])[0];
        if (Number(duplicates.duplicate_stock_code) > 0) {
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: [{
                        field: ErrorField.STOCK_CODE,
                        message: ErrorMessage.STOCK_CODE_DUPLICATE
                    }]
                }
            });
        }

        const result = await service.create(payload);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = (result.data as WastrelMSPlateRow[])[0];
                console.log("[Controller] Wastrel MS plate created successfully with ID:", data.wmsp_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.CREATED),
                        id: data.wmsp_id,
                        mm_id: data.wmsp_mm_id,
                        msp_id: data.wmsp_msp_id,
                        stock_code: data.wmsp_stock_code,
                        length: data.wmsp_length,
                        width: data.wmsp_width,
                        thickness: data.wmsp_thickness,
                        quantity: data.wmsp_quantity,
                        available_quantity: data.wmsp_available_quantity,
                        loc_id: data.wmsp_loc_id,
                        location_type: data.wmsp_location_type,
                        location: data.wmsp_location,
                        status: data.wmsp_status,
                        ord_id: data.wmsp_ord_id,
                        odd_id: data.wmsp_odd_id,
                        remark: data.wmsp_remark,
                        created_at: data.wmsp_created_at,
                        updated_at: data.wmsp_updated_at
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from creating wastrel MS plate:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating wastrel MS plate:", error);
        return send_internal_error(reply);
    }
}

async function get(request: WastrelMSPlateRequest, reply: FastifyReply) {
    try {
        const fields: string = request.reply_fields || "*";
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
        if (request.query.loc_id) {
            conditions.params.push(sanitize_input(request.query.loc_id));
            conditions.sql += ` AND wmsp_loc_id = $${conditions.params.length} `;
        }
        if (request.query.ord_id) {
            conditions.params.push(sanitize_input(request.query.ord_id));
            conditions.sql += ` AND wmsp_ord_id = $${conditions.params.length} `;
        }
        if (request.query.odd_id) {
            conditions.params.push(sanitize_input(request.query.odd_id));
            conditions.sql += ` AND wmsp_odd_id = $${conditions.params.length} `;
        }
        if (request.query.stock_code) {
            conditions.params.push(sanitize_input(request.query.stock_code));
            conditions.sql += ` AND wmsp_stock_code = $${conditions.params.length} `;
        }
        if (request.query.location_type && is_enum_key(location_type_enum, request.query.location_type)) {
            conditions.params.push(LocationType[to_enum_key(request.query.location_type) as keyof typeof LocationType]);
            conditions.sql += ` AND wmsp_location_type::text = $${conditions.params.length} `;
        } else if (request.query.location_type) {
            invalid_fields.push({ field: ErrorField.LOCATION_TYPE, message: ErrorMessage.LOCATION_TYPE_INVALID });
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(StockStatus[to_enum_key(request.query.status) as keyof typeof StockStatus]);
            conditions.sql += ` AND wmsp_status::text = $${conditions.params.length} `;
        } else if (request.query.status) {
            invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_INVALID });
        }

        if (invalid_fields.length > 0) {
            return send_validation_errors(reply, invalid_fields);
        }

        const results = await service.get(conditions, fields);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} wastrel MS plates.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        status: request.query.status,
                        wastrel_ms_plates: (results.data as WastrelMSPlateRow[] | null)?.map(map_wastrel_ms_plate)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from getting wastrel MS plates:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting wastrel MS plates:", error);
        return send_internal_error(reply);
    }
}

async function update(request: WastrelMSPlateRequest, reply: FastifyReply) {
    try {
        const wmsp_id_param = request.params.wmsp_id;
        if (!wmsp_id_param) {
            return send_validation_errors(reply, [{
                field: ErrorField.ID,
                message: ErrorMessage.ID_REQUIRED
            }], HttpStatusCode.BAD_REQUEST);
        }

        const wmsp_id = sanitize_string(wmsp_id_param);
        const sanitized_body = sanitize_payload(request.body ?? {}) as WastrelMSPlateBody;
        const payload = normalize_payload(sanitized_body);

        const wmsp_data = await service.get({ sql: " AND wmsp_id = $1 ", params: [wmsp_id] });
        if (wmsp_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return send_not_found(reply);
        } else if (wmsp_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return send_internal_error(reply);
        }

        const invalid_fields = validate_payload(payload, true);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel MS plate update payload:", invalid_fields);
            return send_validation_errors(reply, invalid_fields);
        }

        const duplicate_check = await service.count_duplicate({
            sql: " AND wmsp_id != $2",
            params: [payload.stock_code, wmsp_id]
        });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return send_internal_error(reply);
        }
        const duplicates = (duplicate_check.data as DuplicateCountRow[])[0];
        if (Number(duplicates.duplicate_stock_code) > 0) {
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: [{
                        field: ErrorField.STOCK_CODE,
                        message: ErrorMessage.STOCK_CODE_DUPLICATE
                    }]
                }
            });
        }

        const result = await service.update(wmsp_id, payload);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Wastrel MS plate with ID ${wmsp_id} has been updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.UPDATED)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from updating wastrel MS plate:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating wastrel MS plate:", error);
        return send_internal_error(reply);
    }
}

async function update_status(request: WastrelMSPlateRequest, reply: FastifyReply) {
    try {
        const invalid_fields: ValidationError[] = [];
        const wmsp_id_param = request.params.wmsp_id;
        const status_payload = request.body?.status;

        if (!wmsp_id_param || !status_payload) {
            if (!wmsp_id_param) {
                invalid_fields.push({ field: ErrorField.ID, message: ErrorMessage.ID_REQUIRED });
            }
            if (!status_payload) {
                invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_REQUIRED });
            }
            return send_validation_errors(reply, invalid_fields, HttpStatusCode.BAD_REQUEST);
        }

        const wmsp_id = sanitize_string(wmsp_id_param);
        const raw_status = sanitize_input(status_payload);
        if (!is_enum_key(status_enum, raw_status)) {
            return send_validation_errors(reply, [{
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            }]);
        }
        const status = StockStatus[to_enum_key(raw_status) as keyof typeof StockStatus];

        const wmsp_data = await service.get({ sql: " AND wmsp_id = $1 ", params: [wmsp_id] });
        if (wmsp_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return send_not_found(reply);
        } else if (wmsp_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return send_internal_error(reply);
        }

        const result = await service.update_status(wmsp_id, status);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Wastrel MS plate with ID ${wmsp_id} status updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(" ", ReplySuccessMessage.STATUS_UPDATED)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from updating wastrel MS plate status:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating wastrel MS plate status:", error);
        return send_internal_error(reply);
    }
}

const controller = {
    create,
    get,
    update,
    update_status
};

export default controller;
