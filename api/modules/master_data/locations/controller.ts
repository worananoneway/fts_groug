import { reply_options } from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    LocationType,
    Payload,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import {
    Condition,
    HttpStatusCode,
    Reply,
    Status
} from '@/api/utils/shared_types';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';

const location_type_enum = get_enum_keys(LocationType);
const status_enum = get_enum_keys(Status);

const module_name = 'Location';

// ค่าว่างจาก form ให้เก็บเป็น NULL ไม่ใช่สตริงว่าง
function to_null(value: any): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}
// รับได้ทั้งคีย์สั้น (code/name/type) และคีย์ที่มี prefix ตามคอลัมน์ (loc_code/loc_name/loc_type)
function to_payload(body: any): Payload {
    const source: any = sanitize_payload(body ?? {});
    return {
        code: to_null(source.code ?? source.loc_code) ?? '',
        name: to_null(source.name ?? source.loc_name) ?? '',
        type: (to_null(source.type ?? source.loc_type) ?? '') as LocationType,
        parent_id: to_null(source.parent_id ?? source.loc_parent_id),
        detail: to_null(source.detail ?? source.loc_detail)
    };
}
// ตรวจความถูกต้องของ payload ที่ใช้ร่วมกันทั้ง create และ update
function validate_payload(payload: Payload): ValidationError[] {
    const invalid_fields: ValidationError[] = [];
    if (!payload.code) {
        invalid_fields.push({
            field: ErrorField.CODE,
            message: ErrorMessage.CODE_REQUIRED
        });
    }
    if (payload.code && payload.code.length > 50) {
        invalid_fields.push({
            field: ErrorField.CODE,
            message: ErrorMessage.CODE_MAX_LENGTH
        });
    }
    if (!payload.name) {
        invalid_fields.push({
            field: ErrorField.NAME,
            message: ErrorMessage.NAME_REQUIRED
        });
    }
    if (payload.name && payload.name.length > 100) {
        invalid_fields.push({
            field: ErrorField.NAME,
            message: ErrorMessage.NAME_MAX_LENGTH
        });
    }
    if (!payload.type) {
        invalid_fields.push({
            field: ErrorField.TYPE,
            message: ErrorMessage.TYPE_REQUIRED
        });
    } else if (!is_enum_key(location_type_enum, payload.type)) {
        invalid_fields.push({
            field: ErrorField.TYPE,
            message: ErrorMessage.TYPE_INVALID
        });
    } else {
        payload.type = LocationType[payload.type.toUpperCase() as keyof typeof LocationType];
    }
    if (payload.parent_id && payload.parent_id.length > 20) {
        invalid_fields.push({
            field: ErrorField.PARENT_ID,
            message: ErrorMessage.PARENT_ID_MAX_LENGTH
        });
    }
    return invalid_fields;
}

async function create(request: any, reply: any) {
    try {
        const user = request.user;

        emp_authentication(module_name, user, reply);

        const payload: Payload = to_payload(request.body);
        console.log(`[Controller] Creating ${module_name} with payload:`, payload);

        const invalid_fields: ValidationError[] = validate_payload(payload);
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} creation payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields, `Validation errors found in ${module_name} creation payload.`)
            );
        }
        if (payload.parent_id) {
            const parent_data = await service.get({ sql: ` AND l.loc_id = $1 `, params: [payload.parent_id] });
            if (parent_data.statuscode !== HttpStatusCode.OK) {
                return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                    reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, [{
                        field: ErrorField.PARENT_ID,
                        message: ErrorMessage.PARENT_ID_INVALID
                    }])
                );
            }
        }
        const conditions: Condition = { sql: '', params: [payload.code] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
                reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
        const duplicates = duplicate_check.data![0];
        if (Number(duplicates.duplicate_code) > 0) {
            console.error(`[Controller] Duplicate errors found in ${module_name} creation:`, payload.code);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>
                reply_result(module_name, HttpStatusCode.CONFLICT, [{
                    field: ErrorField.CODE,
                    message: ErrorMessage.CODE_DUPLICATE
                }])
            );
        }
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
        const fields: string = request.reply_fields;
        const conditions: Condition = { sql: '', params: [] };

        const invalid_fields: ValidationError[] = [];
        if (request.params.loc_id) {
            conditions.params.push(sanitize_string(request.params.loc_id));
            conditions.sql += ` AND l.loc_id = $${conditions.params.length} `;
        }
        if (request.query.type && is_enum_key(location_type_enum, request.query.type)) {
            conditions.params.push(LocationType[request.query.type.toUpperCase() as keyof typeof LocationType]);
            conditions.sql += ` AND l.loc_type = $${conditions.params.length} `;
        } else if (request.query.type) {
            console.error(`[Controller] Invalid Type enum of type value provided for ${module_name}: `, request.query.type);
            invalid_fields.push({
                field: ErrorField.TYPE,
                message: ErrorMessage.TYPE_INVALID
            });
        }
        if (request.query.status && is_enum_key(status_enum, request.query.status)) {
            conditions.params.push(Status[request.query.status.toUpperCase() as keyof typeof Status]);
            conditions.sql += ` AND l.loc_status = $${conditions.params.length} `;
        } else if (request.query.status) {
            console.error(`[Controller] Invalid Type enum of status value provided for ${module_name}: `, request.query.status);
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
        console.error(`[Controller] An error occurred during getting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function soft_delete(request: any, reply: any) {
    try {
        const user = request.user;

        emp_authentication(module_name, user, reply);

        if (!request.params.loc_id) {
            console.error(`[Controller] Missing ${module_name} ID for ${module_name} deletion.`);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.PARAM_ID,
                    message: ErrorMessage.PARAM_ID_REQUIRED
                }])
            );
        }
        const loc_id: string = sanitize_string(request.params.loc_id);
        const location_data = await service.get({ sql: ` AND l.loc_id = $1 `, params: [loc_id] });
        if (location_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(location_data.statuscode).send(<Reply>
                reply_result(module_name, location_data.statuscode, null, location_data?.data)
            );
        }
        const result = await service.soft_delete(loc_id);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during deleting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}
async function update(request: any, reply: any) {
    try {
        const user = request.user;

        emp_authentication(module_name, user, reply);

        if (!request.params.loc_id) {
            console.error(`[Controller] Missing ${module_name} ID for ${module_name} update.`);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.PARAM_ID,
                    message: ErrorMessage.PARAM_ID_REQUIRED
                }])
            );
        }
        const loc_id: string = sanitize_string(request.params.loc_id);
        const payload: Payload = to_payload(request.body);
        const location_data = await service.get({ sql: ` AND l.loc_id = $1 `, params: [loc_id] });
        if (location_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(location_data.statuscode).send(<Reply>
                reply_result(module_name, location_data.statuscode)
            );
        }
        const invalid_fields: ValidationError[] = validate_payload(payload);
        if (payload.parent_id && payload.parent_id === loc_id) {
            invalid_fields.push({
                field: ErrorField.PARENT_ID,
                message: ErrorMessage.PARENT_ID_SELF
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} update payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        if (payload.parent_id) {
            const parent_data = await service.get({ sql: ` AND l.loc_id = $1 `, params: [payload.parent_id] });
            if (parent_data.statuscode !== HttpStatusCode.OK) {
                return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                    reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, [{
                        field: ErrorField.PARENT_ID,
                        message: ErrorMessage.PARENT_ID_INVALID
                    }])
                );
            }
        }
        const conditions: Condition = { sql: ' AND loc_id != $2 ', params: [payload.code, loc_id] };
        const duplicate_check = await service.count_duplicate(conditions);
        if (duplicate_check.statuscode !== HttpStatusCode.OK) {
            return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
                reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
        const duplicates = duplicate_check.data![0];
        if (Number(duplicates.duplicate_code) > 0) {
            console.error(`[Controller] Duplicate errors found in ${module_name} update:`, payload.code);
            return reply.code(HttpStatusCode.CONFLICT).send(<Reply>
                reply_result(module_name, HttpStatusCode.CONFLICT, [{
                    field: ErrorField.CODE,
                    message: ErrorMessage.CODE_DUPLICATE
                }])
            );
        }
        const result = await service.update(loc_id, payload);
        return reply.code(result.statuscode).send(<Reply>
            reply_result(module_name, result.statuscode)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during updating ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

const controller = {
    create,
    get,
    soft_delete,
    update
};

export default controller;
