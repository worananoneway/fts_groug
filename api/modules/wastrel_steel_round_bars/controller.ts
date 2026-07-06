import {
    Location,
    Material,
    Order,
    OrderDetail,
    SourceSteelRoundBar,
    WastrelSteelRoundBar
} from './model';
import { FastifyReply, FastifyRequest } from 'fastify';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    LocationType,
    Payload,
    StockStatus,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_input, sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import {
    Condition,
    HttpStatus,
    HttpStatusCode,
    Reply,
    ReplyErrorField,
    ReplyErrorMessage,
    ReplySuccessMessage,
} from '@/api/utils/shared_types';

const location_type_enum = get_enum_keys(LocationType);
const status_enum = get_enum_keys(StockStatus);
const module_name = 'WastrelSteelRoundBar';

export interface WastrelSteelRoundBarParams {
    wsrb_id?: string;
}

export interface WastrelSteelRoundBarQuery {
    mm_id?: string;
    srb_id?: string;
    loc_id?: string;
    ord_id?: string;
    odd_id?: string;
    location_type?: string;
    status?: string;
}

export type WastrelSteelRoundBarBody = Partial<Payload> & {
    status?: string;
};

type WastrelSteelRoundBarRequest = FastifyRequest<{
    Params: WastrelSteelRoundBarParams;
    Querystring: WastrelSteelRoundBarQuery;
    Body: WastrelSteelRoundBarBody;
}> & {
    reply_fields?: string;
};

interface DuplicateCountRow {
    duplicate_code: string | number;
}

interface WastrelSteelRoundBarRow {
    wsrb_id: string;
    wsrb_mm_id: string;
    wsrb_mm_code?: string | null;
    wsrb_mm_name?: string | null;
    wsrb_mm_shape_type?: string | null;
    wsrb_mm_grade?: string | null;
    wsrb_srb_id?: string | null;
    wsrb_srb_code?: string | null;
    wsrb_code: string;
    wsrb_diameter: number;
    wsrb_length: number;
    wsrb_quantity: number;
    wsrb_available_quantity: number;
    wsrb_loc_id?: string | null;
    wsrb_loc_code?: string | null;
    wsrb_loc_name?: string | null;
    wsrb_loc_type?: string | null;
    wsrb_location_type?: string | null;
    wsrb_location?: string | null;
    wsrb_status: string;
    wsrb_ord_id?: string | null;
    wsrb_ord_no?: string | null;
    wsrb_odd_id?: string | null;
    wsrb_odd_ord_id?: string | null;
    wsrb_remark?: string | null;
    wsrb_created_at: Date;
    wsrb_updated_at?: Date | null;
}

function to_enum_key(value: unknown): string {
    return String(value).trim().replace(/\s+/g, '_').toUpperCase();
}

function has_value(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
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

function normalize_optional_string(value: string | null | undefined): string | null | undefined {
    return value === '' ? null : value;
}

function normalize_payload(payload: Payload): Payload {
    payload.srb_id = normalize_optional_string(payload.srb_id);
    payload.loc_id = normalize_optional_string(payload.loc_id);
    payload.location = normalize_optional_string(payload.location);
    payload.ord_id = normalize_optional_string(payload.ord_id);
    payload.odd_id = normalize_optional_string(payload.odd_id);
    payload.remark = normalize_optional_string(payload.remark);

    if (has_value(payload.diameter)) payload.diameter = Number(payload.diameter);
    if (has_value(payload.length)) payload.length = Number(payload.length);
    if (has_value(payload.quantity)) payload.quantity = Number(payload.quantity);
    if (has_value(payload.available_quantity)) payload.available_quantity = Number(payload.available_quantity);

    return payload;
}

function validate_payload(payload: Payload, require_inventory: boolean): ValidationError[] {
    const invalid_fields: ValidationError[] = [];

    if (!has_value(payload.mm_id)) {
        invalid_fields.push({ field: ErrorField.MM_ID, message: ErrorMessage.MM_ID_REQUIRED });
    } else if (payload.mm_id.length > 20) {
        invalid_fields.push({ field: ErrorField.MM_ID, message: ErrorMessage.MM_ID_MAX_LENGTH });
    }

    if (has_value(payload.srb_id) && payload.srb_id!.length > 20) {
        invalid_fields.push({ field: ErrorField.SRB_ID, message: ErrorMessage.SRB_ID_MAX_LENGTH });
    }

    if (!has_value(payload.code)) {
        invalid_fields.push({ field: ErrorField.CODE, message: ErrorMessage.CODE_REQUIRED });
    } else if (payload.code.length > 50) {
        invalid_fields.push({ field: ErrorField.CODE, message: ErrorMessage.CODE_MAX_LENGTH });
    }

    if (!has_value(payload.diameter)) {
        invalid_fields.push({ field: ErrorField.DIAMETER, message: ErrorMessage.DIAMETER_REQUIRED });
    } else if (!is_positive_number(payload.diameter)) {
        invalid_fields.push({ field: ErrorField.DIAMETER, message: ErrorMessage.DIAMETER_INVALID });
    }

    if (!has_value(payload.length)) {
        invalid_fields.push({ field: ErrorField.LENGTH, message: ErrorMessage.LENGTH_REQUIRED });
    } else if (!is_positive_number(payload.length)) {
        invalid_fields.push({ field: ErrorField.LENGTH, message: ErrorMessage.LENGTH_INVALID });
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

function map_wastrel_steel_round_bar(wsrb: WastrelSteelRoundBarRow): WastrelSteelRoundBar {
    return new WastrelSteelRoundBar(
        wsrb.wsrb_id,
        new Material(
            wsrb.wsrb_mm_id,
            wsrb.wsrb_mm_code ?? null,
            wsrb.wsrb_mm_name ?? null,
            wsrb.wsrb_mm_shape_type ?? null,
            wsrb.wsrb_mm_grade ?? null
        ),
        wsrb.wsrb_srb_id
            ? new SourceSteelRoundBar(wsrb.wsrb_srb_id, wsrb.wsrb_srb_code ?? null)
            : null,
        wsrb.wsrb_code,
        wsrb.wsrb_diameter,
        wsrb.wsrb_length,
        wsrb.wsrb_quantity,
        wsrb.wsrb_available_quantity,
        wsrb.wsrb_loc_id
            ? new Location(wsrb.wsrb_loc_id, wsrb.wsrb_loc_code ?? null, wsrb.wsrb_loc_name ?? null, wsrb.wsrb_loc_type as LocationType | null)
            : null,
        wsrb.wsrb_location_type as LocationType | null,
        wsrb.wsrb_location ?? null,
        wsrb.wsrb_status as StockStatus,
        wsrb.wsrb_ord_id ? new Order(wsrb.wsrb_ord_id, wsrb.wsrb_ord_no ?? null) : null,
        wsrb.wsrb_odd_id ? new OrderDetail(wsrb.wsrb_odd_id, wsrb.wsrb_odd_ord_id ?? null) : null,
        wsrb.wsrb_remark ?? null,
        wsrb.wsrb_created_at,
        wsrb.wsrb_updated_at ?? null
    );
}

async function create(request: WastrelSteelRoundBarRequest, reply: FastifyReply) {
    try {
        const payload: Payload = normalize_payload(sanitize_payload(request.body ?? {}));
        console.log("[Controller] Creating wastrel steel round bar with payload:", payload);

        const invalid_fields = validate_payload(payload, false);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel steel round bar creation payload:", invalid_fields);
            return send_validation_errors(reply, invalid_fields);
        }

        const duplicate_check = await service.count_duplicate({ sql: '', params: [payload.code] });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return send_internal_error(reply);
        }

        const duplicates = (duplicate_check.data as DuplicateCountRow[])[0];
        if (Number(duplicates.duplicate_code) > 0) {
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: [{
                        field: ErrorField.CODE,
                        message: ErrorMessage.CODE_DUPLICATE
                    }]
                }
            });
        }

        const result = await service.create(payload);
        switch (result.statuscode) {
            case HttpStatusCode.CREATED:
                const data = (result.data as WastrelSteelRoundBarRow[])[0];
                console.log("[Controller] Wastrel steel round bar created successfully with ID:", data.wsrb_id);
                return reply.code(HttpStatusCode.CREATED).send(<Reply>{
                    status: HttpStatus.CREATED,
                    statuscode: HttpStatusCode.CREATED,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.CREATED),
                        id: data.wsrb_id,
                        mm_id: data.wsrb_mm_id,
                        srb_id: data.wsrb_srb_id,
                        code: data.wsrb_code,
                        diameter: data.wsrb_diameter,
                        length: data.wsrb_length,
                        quantity: data.wsrb_quantity,
                        available_quantity: data.wsrb_available_quantity,
                        loc_id: data.wsrb_loc_id,
                        location_type: data.wsrb_location_type,
                        location: data.wsrb_location,
                        status: data.wsrb_status,
                        ord_id: data.wsrb_ord_id,
                        odd_id: data.wsrb_odd_id,
                        remark: data.wsrb_remark,
                        created_at: data.wsrb_created_at,
                        updated_at: data.wsrb_updated_at
                    }
                });
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from creating wastrel steel round bar:", result.statuscode);
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
        console.error("[Controller] An error occurred during creating wastrel steel round bar:", error);
        return send_internal_error(reply);
    }
}

async function get(request: WastrelSteelRoundBarRequest, reply: FastifyReply) {
    try {
        const fields: string = request.reply_fields || '*';
        const conditions: Condition = { sql: '', params: [] };
        const invalid_fields: ValidationError[] = [];

        if (request.params.wsrb_id) {
            conditions.params.push(sanitize_string(request.params.wsrb_id));
            conditions.sql += ` AND wsrb_id = $${conditions.params.length} `;
        }
        if (request.query.mm_id) {
            conditions.params.push(sanitize_input(request.query.mm_id));
            conditions.sql += ` AND wsrb_mm_id = $${conditions.params.length} `;
        }
        if (request.query.srb_id) {
            conditions.params.push(sanitize_input(request.query.srb_id));
            conditions.sql += ` AND wsrb_srb_id = $${conditions.params.length} `;
        }
        if (request.query.loc_id) {
            conditions.params.push(sanitize_input(request.query.loc_id));
            conditions.sql += ` AND wsrb_loc_id = $${conditions.params.length} `;
        }
        if (request.query.ord_id) {
            conditions.params.push(sanitize_input(request.query.ord_id));
            conditions.sql += ` AND wsrb_ord_id = $${conditions.params.length} `;
        }
        if (request.query.odd_id) {
            conditions.params.push(sanitize_input(request.query.odd_id));
            conditions.sql += ` AND wsrb_odd_id = $${conditions.params.length} `;
        }
        if (request.query.location_type && is_enum_key(location_type_enum, request.query.location_type)) {
            conditions.params.push(LocationType[to_enum_key(request.query.location_type) as keyof typeof LocationType]);
            conditions.sql += ` AND wsrb_location_type::text = $${conditions.params.length} `;
        } else if (request.query.location_type) {
            invalid_fields.push({ field: ErrorField.LOCATION_TYPE, message: ErrorMessage.LOCATION_TYPE_INVALID });
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(StockStatus[to_enum_key(request.query.status) as keyof typeof StockStatus]);
            conditions.sql += ` AND wsrb_status::text = $${conditions.params.length} `;
        } else if (request.query.status) {
            invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_INVALID });
        }

        if (invalid_fields.length > 0) {
            return send_validation_errors(reply, invalid_fields);
        }

        const results = await service.get(conditions, fields);
        switch (results.statuscode) {
            case HttpStatusCode.OK:
                console.log(`[Controller] Successfully retrieved ${results.data?.length || 0} wastrel steel round bars.`);
                return reply.code(HttpStatusCode.OK).send(<Reply>{
                    status: HttpStatus.OK,
                    statuscode: HttpStatusCode.OK,
                    details: {
                        status: request.query.status,
                        wastrel_steel_round_bars: (results.data as WastrelSteelRoundBarRow[] | null)?.map(map_wastrel_steel_round_bar)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from getting wastrel steel round bars:", results.statuscode);
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
        console.error("[Controller] An error occurred during getting wastrel steel round bars:", error);
        return send_internal_error(reply);
    }
}

async function update(request: WastrelSteelRoundBarRequest, reply: FastifyReply) {
    try {
        if (!request.params.wsrb_id) {
            return send_validation_errors(reply, [{
                field: ErrorField.ID,
                message: ErrorMessage.ID_REQUIRED
            }], HttpStatusCode.BAD_REQUEST);
        }

        const wsrb_param_id = request.params.wsrb_id;
        if (!wsrb_param_id) {
            return send_validation_errors(reply, [{
                field: ErrorField.ID,
                message: ErrorMessage.ID_REQUIRED
            }], HttpStatusCode.BAD_REQUEST);
        }

        const wsrb_id = sanitize_string(wsrb_param_id);
        const payload: Payload = normalize_payload(sanitize_payload(request.body ?? {}));

        const wsrb_data = await service.get({ sql: ' AND wsrb_id = $1 ', params: [wsrb_id] });
        if (wsrb_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return send_not_found(reply);
        } else if (wsrb_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return send_internal_error(reply);
        }

        const invalid_fields = validate_payload(payload, true);
        if (invalid_fields.length > 0) {
            console.error("[Controller] Validation errors found in wastrel steel round bar update payload:", invalid_fields);
            return send_validation_errors(reply, invalid_fields);
        }

        const duplicate_check = await service.count_duplicate({
            sql: ' AND wsrb_id != $2',
            params: [payload.code, wsrb_id]
        });
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return send_internal_error(reply);
        }
        const duplicates = (duplicate_check.data as DuplicateCountRow[])[0];
        if (Number(duplicates.duplicate_code) > 0) {
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>{
                status: HttpStatus.CONFLICT,
                statuscode: HttpStatusCode.CONFLICT,
                details: {
                    error: ReplyErrorField.DUPLICATE_ENTRY,
                    message: ReplyErrorMessage.DUPLICATE_ENTRY,
                    duplicates: [{
                        field: ErrorField.CODE,
                        message: ErrorMessage.CODE_DUPLICATE
                    }]
                }
            });
        }

        const result = await service.update(wsrb_id, payload);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Wastrel steel round bar with ID ${wsrb_id} has been updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.UPDATED)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from updating wastrel steel round bar:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating wastrel steel round bar:", error);
        return send_internal_error(reply);
    }
}

async function update_status(request: WastrelSteelRoundBarRequest, reply: FastifyReply) {
    try {
        const invalid_fields: ValidationError[] = [];
        const wsrb_id_param = request.params.wsrb_id;
        const status_payload = request.body?.status;

        if (!wsrb_id_param || !status_payload) {
            if (!wsrb_id_param) {
                invalid_fields.push({ field: ErrorField.ID, message: ErrorMessage.ID_REQUIRED });
            }
            if (!status_payload) {
                invalid_fields.push({ field: ErrorField.STATUS, message: ErrorMessage.STATUS_REQUIRED });
            }
            return send_validation_errors(reply, invalid_fields, HttpStatusCode.BAD_REQUEST);
        }

        const wsrb_id: string = sanitize_string(wsrb_id_param);
        const raw_status = sanitize_input(status_payload);
        if (!is_enum_key(status_enum, raw_status)) {
            return send_validation_errors(reply, [{
                field: ErrorField.STATUS,
                message: ErrorMessage.STATUS_INVALID
            }]);
        }
        const status = StockStatus[to_enum_key(raw_status) as keyof typeof StockStatus];

        const wsrb_data = await service.get({ sql: ' AND wsrb_id = $1 ', params: [wsrb_id] });
        if (wsrb_data.statuscode === HttpStatusCode.NOT_FOUND) {
            return send_not_found(reply);
        } else if (wsrb_data.statuscode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
            return send_internal_error(reply);
        }

        const result = await service.update_status(wsrb_id, status);
        switch (result.statuscode) {
            case HttpStatusCode.NO_CONTENT:
                console.log(`[Controller] Wastrel steel round bar with ID ${wsrb_id} status updated successfully`);
                return reply.code(HttpStatusCode.NO_CONTENT).send(<Reply>{
                    status: HttpStatus.NO_CONTENT,
                    statuscode: HttpStatusCode.NO_CONTENT,
                    details: {
                        message: module_name.concat(' ', ReplySuccessMessage.STATUS_UPDATED)
                    }
                });
            case HttpStatusCode.NOT_FOUND:
                return send_not_found(reply);
            case HttpStatusCode.INTERNAL_SERVER_ERROR:
                return send_internal_error(reply);
            default:
                console.error("[Controller] An unrecognized status code was returned from updating wastrel steel round bar status:", result.statuscode);
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
        console.error("[Controller] An error occurred during updating wastrel steel round bar status:", error);
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
