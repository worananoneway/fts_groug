import { reply_options } from './model';
import service from './service';
import {
    ErrorField,
    ErrorMessage,
    Payload,
    StockLocationType,
    ValidationError
} from './type';

import { get_enum_keys, is_enum_key } from '@/api/utils/enum_checker';
import { sanitize_payload, sanitize_string } from '@/api/utils/input_sanitizer';
import {
    Condition,
    HttpStatusCode,
    Reply
} from '@/api/utils/shared_types';
import { reply_result } from '@/api/utils/controller_replys';
import { emp_authentication } from '@/api/utils/controller_auth';

const stock_type_enum = get_enum_keys(StockLocationType);

const module_name = 'Stock Location';

// ค่าว่างจาก form ให้เก็บเป็น NULL ไม่ใช่สตริงว่าง
function to_null(value: any): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}
// แปลงค่าที่ผู้ใช้ส่งมาเป็นคีย์ของ enum (รับ 'ms plate' / 'ms_plate' / 'Ms_plate' ได้)
function to_enum_key(value: string): keyof typeof StockLocationType {
    return value.trim().replace(/\s+/g, '_').toUpperCase() as keyof typeof StockLocationType;
}
// รับได้ทั้งคีย์สั้น (stock_type/stock_code/loc_id) และคีย์ที่มี prefix ตามคอลัมน์ (sl_*)
function to_payload(body: any): Payload {
    const source: any = sanitize_payload(body ?? {});
    return {
        stock_type: (to_null(source.stock_type ?? source.sl_stock_type) ?? '') as StockLocationType,
        stock_code: to_null(source.stock_code ?? source.sl_stock_code) ?? '',
        loc_id: to_null(source.loc_id ?? source.sl_loc_id),
        scheduled_at: to_null(source.scheduled_at ?? source.sl_scheduled_at),
        remark: to_null(source.remark ?? source.sl_remark)
    };
}

async function get(request: any, reply: any) {
    try {
        const fields: string = request.reply_fields;
        const conditions: Condition = { sql: '', params: [] };

        const invalid_fields: ValidationError[] = [];
        if (request.params?.sl_id) {
            conditions.params.push(sanitize_string(request.params.sl_id));
            conditions.sql += ` AND sl.sl_id = $${conditions.params.length} `;
        }
        if (request.query.stock_type && is_enum_key(stock_type_enum, request.query.stock_type)) {
            conditions.params.push(StockLocationType[to_enum_key(String(request.query.stock_type))]);
            conditions.sql += ` AND sl.sl_stock_type = $${conditions.params.length} `;
        } else if (request.query.stock_type) {
            console.error(`[Controller] Invalid Type enum of stock_type value provided for ${module_name}: `, request.query.stock_type);
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        }
        if (request.query.stock_code) {
            conditions.params.push(sanitize_string(String(request.query.stock_code)));
            conditions.sql += ` AND sl.sl_stock_code = $${conditions.params.length} `;
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

        const emp_id: string | null = user?.id ?? null;
        if (!request.params.sl_id) {
            console.error(`[Controller] Missing ${module_name} ID for ${module_name} deletion.`);
            return reply.code(HttpStatusCode.BAD_REQUEST).send(<Reply>
                reply_result(module_name, HttpStatusCode.BAD_REQUEST, [{
                    field: ErrorField.PARAM_ID,
                    message: ErrorMessage.PARAM_ID_REQUIRED
                }])
            );
        }
        const sl_id: string = sanitize_string(request.params.sl_id);
        const stock_location_data = await service.get({ sql: ` AND sl.sl_id = $1 `, params: [sl_id] });
        if (stock_location_data.statuscode !== HttpStatusCode.OK) {
            return reply.code(stock_location_data.statuscode).send(<Reply>
                reply_result(module_name, stock_location_data.statuscode, null, stock_location_data?.data)
            );
        }
        const result = await service.soft_delete(sl_id, emp_id);
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
async function upsert(request: any, reply: any) {
    try {
        const user = request.user;

        emp_authentication(module_name, user, reply);

        const emp_id: string | null = user?.id ?? null;
        const payload: Payload = to_payload(request.body);
        console.log(`[Controller] Upserting ${module_name} with payload:`, payload);

        const invalid_fields: ValidationError[] = [];
        if (!payload.stock_type) {
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_REQUIRED
            });
        } else if (!is_enum_key(stock_type_enum, payload.stock_type)) {
            invalid_fields.push({
                field: ErrorField.STOCK_TYPE,
                message: ErrorMessage.STOCK_TYPE_INVALID
            });
        } else {
            payload.stock_type = StockLocationType[to_enum_key(payload.stock_type)];
        }
        if (!payload.stock_code) {
            invalid_fields.push({
                field: ErrorField.STOCK_CODE,
                message: ErrorMessage.STOCK_CODE_REQUIRED
            });
        }
        if (payload.stock_code && payload.stock_code.length > 100) {
            invalid_fields.push({
                field: ErrorField.STOCK_CODE,
                message: ErrorMessage.STOCK_CODE_MAX_LENGTH
            });
        }
        if (payload.loc_id && payload.loc_id.length > 20) {
            invalid_fields.push({
                field: ErrorField.LOC_ID,
                message: ErrorMessage.LOC_ID_MAX_LENGTH
            });
        }
        // ส่ง scheduled_at ว่าง/null = ล้างวัน-เวลาที่กำหนด, ถ้าส่งมาต้องเป็น ISO-8601 ที่แปลงได้
        if (payload.scheduled_at && Number.isNaN(Date.parse(payload.scheduled_at))) {
            invalid_fields.push({
                field: ErrorField.SCHEDULED_AT,
                message: ErrorMessage.SCHEDULED_AT_INVALID
            });
        }
        if (invalid_fields.length > 0) {
            console.error(`[Controller] Validation errors found in ${module_name} upsert payload:`, invalid_fields);
            return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, invalid_fields)
            );
        }
        // ส่ง loc_id ว่าง/null = ล้างตำแหน่งจัดเก็บ ไม่ต้องเช็คว่ามีอยู่จริง
        if (payload.loc_id) {
            const location_check = await service.count_location(payload.loc_id);
            if (location_check.statuscode !== HttpStatusCode.OK) {
                return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
                    reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
                );
            }
            if (Number(location_check.data![0].total) === 0) {
                console.error(`[Controller] Invalid location ID provided for ${module_name}: `, payload.loc_id);
                return reply.code(HttpStatusCode.UNPROCESSABLE_CONTENT).send(<Reply>
                    reply_result(module_name, HttpStatusCode.UNPROCESSABLE_CONTENT, [{
                        field: ErrorField.LOC_ID,
                        message: ErrorMessage.LOC_ID_INVALID
                    }])
                );
            }
        }
        const result = await service.upsert(payload, emp_id);
        if (result.statuscode !== HttpStatusCode.OK) {
            return reply.code(result.statuscode).send(<Reply>
                reply_result(module_name, result.statuscode)
            );
        }
        // อ่านแถวที่ upsert แล้วกลับมาแบบ join locations เพื่อให้หน้าเว็บได้ข้อมูลตำแหน่งครบ
        const sl_id: string = result.data![0].sl_id;
        const results = await service.get({ sql: ` AND sl.sl_id = $1 `, params: [sl_id] });
        return reply.code(results.statuscode).send(<Reply>
            reply_result(module_name, results.statuscode, null, results?.data, reply_options)
        );
    } catch (error) {
        console.error(`[Controller] An error occurred during upserting ${module_name}:`, error);
        return reply.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send(<Reply>
            reply_result(module_name, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

const controller = {
    get,
    soft_delete,
    upsert
};

export default controller;
